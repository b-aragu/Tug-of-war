import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import GameScene2D from './2d/GameScene2D';
import Keypad from './Keypad';
import confetti from 'canvas-confetti';

interface GameViewProps {
    socket: Socket;
    playerId: string;
    onQuestionHistory?: (history: QuestionRecord[]) => void;
    onQuit?: () => void;
}

export type QuestionRecord = {
    question: string;
    correctAnswer: number | null;
    myAnswer: string | null;
    myCorrect: boolean | null;
    opponentAnswer: string | null;
    opponentCorrect: boolean | null;
};

type Feedback = {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
};

export default function GameView({ socket, playerId, onQuestionHistory, onQuit }: GameViewProps) {
    const ropePositionRef = useRef(0);
    const [ropePosition, setRopePosition] = useState(0);
    const [question, setQuestion] = useState('Waiting...');
    const [answer, setAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(1);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [shake, setShake] = useState(false);
    const [winner, setWinner] = useState<'left' | 'right' | null>(null);
    const [opponentAnswer, setOpponentAnswer] = useState<{ value: string; isCorrect: boolean } | null>(null);
    const [score, setScore] = useState({ me: 0, opponent: 0 });

    // Question history tracking
    const questionHistoryRef = useRef<QuestionRecord[]>([]);
    const currentRecordRef = useRef<QuestionRecord | null>(null);

    useEffect(() => {
        socket.on('new_question', (data: { question: string, duration: number }) => {
            // Save previous record if exists
            if (currentRecordRef.current) {
                questionHistoryRef.current.push({ ...currentRecordRef.current });
            }

            setQuestion(data.question);
            setAnswer('');
            setTotalTime(data.duration / 1000);
            setTimeLeft(data.duration / 1000);
            setFeedback(null);
            setOpponentAnswer(null);

            // Start new record
            currentRecordRef.current = {
                question: data.question,
                correctAnswer: null,
                myAnswer: null,
                myCorrect: null,
                opponentAnswer: null,
                opponentCorrect: null,
            };
        });

        socket.on('rope_update', (data: { ropePosition: number, playerId: string, force: number }) => {
            setRopePosition(data.ropePosition);
            ropePositionRef.current = data.ropePosition;
        });

        socket.on('player_answer', (data: { playerId: string, isCorrect: boolean, value: string }) => {
            if (data.playerId !== playerId) {
                setOpponentAnswer({ value: data.value, isCorrect: data.isCorrect });
                setTimeout(() => setOpponentAnswer(null), 2000);

                // Track opponent answer
                if (currentRecordRef.current) {
                    currentRecordRef.current.opponentAnswer = data.value;
                    currentRecordRef.current.opponentCorrect = data.isCorrect;
                }

                if (data.isCorrect) {
                    setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
                }
            }
        });

        socket.on('answer_result', (data: { correct: boolean, force?: number }) => {
            // Track my result
            if (currentRecordRef.current) {
                currentRecordRef.current.myCorrect = data.correct;
            }

            if (data.correct) {
                setFeedback({
                    message: `Nice! +${data.force}`,
                    type: 'success',
                    id: Date.now()
                });
                confetti({
                    particleCount: 30,
                    spread: 50,
                    origin: { y: 0.8 },
                    colors: ['#4ade80', '#22c55e']
                });
                setScore(prev => ({ ...prev, me: prev.me + 1 }));
            } else {
                setFeedback({ message: 'Wrong!', type: 'error', id: Date.now() });
                setShake(true);
                setTimeout(() => setShake(false), 500);
            }
        });

        socket.on('game_over', (data: { winnerId: string }) => {
            // Save final record
            if (currentRecordRef.current) {
                questionHistoryRef.current.push({ ...currentRecordRef.current });
                currentRecordRef.current = null;
            }

            // Send history up
            if (onQuestionHistory) {
                onQuestionHistory(questionHistoryRef.current);
            }

            const rp = ropePositionRef.current;
            if (rp > 20) {
                setWinner('right');
            } else if (rp < -20) {
                setWinner('left');
            } else {
                setWinner(rp > 0 ? 'right' : 'left');
            }
        });

        // Timer countdown
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 0.1));
        }, 100);

        return () => {
            clearInterval(timer);
            socket.off('new_question');
            socket.off('rope_update');
            socket.off('player_answer');
            socket.off('answer_result');
            socket.off('game_over');
        };
    }, [socket, playerId]);

    const answerRef = useRef(answer);
    useEffect(() => { answerRef.current = answer; }, [answer]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                setAnswer((prev) => (prev.length < 5 ? prev + e.key : prev));
            } else if (e.key === 'Backspace') {
                setAnswer(prev => prev.slice(0, -1));
            } else if (e.key === 'Enter') {
                if (answerRef.current) {
                    submitAnswer(answerRef.current);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [socket]);

    const submitAnswer = (ans: string) => {
        socket.emit('submit_answer', ans);

        // Track my answer
        if (currentRecordRef.current) {
            currentRecordRef.current.myAnswer = ans;
        }

        setAnswer('');
    };

    const handleInput = (digit: string) => {
        setAnswer((prev) => (prev.length < 5 ? prev + digit : prev));
    };

    const handleClear = () => {
        setAnswer('');
    };

    const handleSubmit = () => {
        if (answer) {
            submitAnswer(answer);
        }
    };

    return (
        <div className={`w-full max-w-5xl flex flex-col items-center justify-between h-[90vh] py-4 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            {/* 2D Scene Area */}
            <div className="w-full mb-4 relative">
                {/* Score Bar + Quit */}
                <div className="flex justify-between items-center px-4 mb-2">
                    <div className="flex items-center gap-2">
                        {onQuit && (
                            <button onClick={onQuit} className="text-slate-500 hover:text-white text-sm mr-2 transition-colors" title="Quit">
                                ✕
                            </button>
                        )}
                        <span className="text-yellow-400 font-bold text-lg">You</span>
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-bold text-sm">{score.me} ✓</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold text-sm">{score.opponent} ✓</span>
                        <span className="text-red-400 font-bold text-lg">Opponent</span>
                    </div>
                </div>

                {/* Opponent Answer Bubble */}
                {opponentAnswer && (
                    <div className={`absolute top-12 right-4 z-20 px-3 py-1 rounded-lg text-sm font-bold shadow-md animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none
                        ${opponentAnswer.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                    `}>
                        Opponent: {opponentAnswer.value} {opponentAnswer.isCorrect ? '✓' : '✗'}
                    </div>
                )}

                {/* The 2D World */}
                <GameScene2D ropePosition={ropePosition} winner={winner} />

                {/* Feedback Overlay */}
                {feedback && (
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-black animate-bounce whitespace-nowrap z-50 pointer-events-none
                        ${feedback.type === 'success' ? 'text-green-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]' : ''}
                        ${feedback.type === 'error' ? 'text-red-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]' : ''}
                        ${feedback.type === 'info' ? 'text-blue-300 text-sm' : ''}
                    `}>
                        {feedback.message}
                    </div>
                )}
            </div>

            {/* Question Area */}
            <div className="flex flex-col items-center space-y-3 mb-3">
                <div className="text-slate-400 text-sm uppercase tracking-widest">Solve</div>
                <div className="text-5xl font-mono font-bold bg-white/10 px-8 py-4 rounded-xl border border-white/20 relative overflow-hidden">
                    {question}
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-100 ease-linear"
                        style={{ width: `${(timeLeft / totalTime) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Answer Display */}
            <div className={`text-4xl font-mono font-bold min-h-[3rem] mb-4 transition-colors
                ${feedback?.type === 'error' ? 'text-red-500' : 'text-yellow-400'}
            `}>
                {answer || '_'}
            </div>

            {/* Keypad */}
            <div className="w-full px-4">
                <Keypad onInput={handleInput} onClear={handleClear} onSubmit={handleSubmit} />
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    );
}
