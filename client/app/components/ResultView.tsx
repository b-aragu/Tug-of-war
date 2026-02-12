'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QuestionRecord } from './GameView';

interface ResultViewProps {
    result: { winnerId: string; ropePosition: number };
    playerId: string;
    onRematch: () => void;
    onHome?: () => void;
    questionHistory: QuestionRecord[];
}

export default function ResultView({ result, playerId, onRematch, onHome, questionHistory }: ResultViewProps) {
    const isWinner = result.winnerId === playerId;
    const [showRecap, setShowRecap] = useState(false);

    useEffect(() => {
        if (isWinner) {
            // Big celebratory confetti
            const end = Date.now() + 2000;
            const interval = setInterval(() => {
                if (Date.now() > end) { clearInterval(interval); return; }
                confetti({
                    particleCount: 60,
                    spread: 80,
                    origin: { x: Math.random(), y: 0.6 },
                    colors: ['#4ade80', '#facc15', '#60a5fa'],
                });
            }, 250);
            return () => clearInterval(interval);
        }
    }, [isWinner]);

    const myCorrectCount = questionHistory.filter(q => q.myCorrect === true).length;
    const oppCorrectCount = questionHistory.filter(q => q.opponentCorrect === true).length;
    const totalQuestions = questionHistory.length;

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl px-4 space-y-6 animate-in fade-in zoom-in duration-500">
            {/* Main Result */}
            <div className="text-center space-y-3">
                <div className={`text-7xl font-black ${isWinner ? 'text-green-400' : 'text-red-500'}`}>
                    {isWinner ? '🎉 YOU WIN!' : '😔 YOU LOSE'}
                </div>
                <p className="text-xl text-slate-300">
                    {isWinner
                        ? 'You pulled them over! Great math skills!'
                        : 'Your opponent was faster this time!'}
                </p>
            </div>

            {/* Score Summary */}
            <div className="flex gap-8 items-center justify-center">
                <div className={`text-center px-6 py-3 rounded-xl ${isWinner ? 'bg-green-500/20 border-2 border-green-500' : 'bg-slate-700'}`}>
                    <div className="text-3xl font-bold">{myCorrectCount}/{totalQuestions}</div>
                    <div className="text-sm text-slate-400 mt-1">You</div>
                </div>
                <div className="text-2xl text-slate-500 font-bold">VS</div>
                <div className={`text-center px-6 py-3 rounded-xl ${!isWinner ? 'bg-red-500/20 border-2 border-red-500' : 'bg-slate-700'}`}>
                    <div className="text-3xl font-bold">{oppCorrectCount}/{totalQuestions}</div>
                    <div className="text-sm text-slate-400 mt-1">Opponent</div>
                </div>
            </div>

            {/* Recap Toggle */}
            <button
                onClick={() => setShowRecap(!showRecap)}
                className="text-blue-400 underline hover:text-blue-300 transition-colors text-sm"
            >
                {showRecap ? 'Hide Question Recap' : 'View Question Recap'}
            </button>

            {/* Question Recap Table */}
            {showRecap && questionHistory.length > 0 && (
                <div className="w-full overflow-hidden rounded-xl border border-white/10">
                    <div className="overflow-y-auto max-h-64">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-slate-400">#</th>
                                    <th className="px-3 py-2 text-left text-slate-400">Question</th>
                                    <th className="px-3 py-2 text-center text-slate-400">Your Answer</th>
                                    <th className="px-3 py-2 text-center text-slate-400">Opponent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questionHistory.map((q, i) => (
                                    <tr key={i} className="border-t border-white/5 odd:bg-white/5">
                                        <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                                        <td className="px-3 py-2 font-mono">{q.question}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${q.myCorrect === true ? 'bg-green-500/20 text-green-400' :
                                                q.myCorrect === false ? 'bg-red-500/20 text-red-400' :
                                                    'text-slate-500'
                                                }`}>
                                                {q.myAnswer ?? '—'}
                                                {q.myCorrect === true ? ' ✓' : q.myCorrect === false ? ' ✗' : ''}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${q.opponentCorrect === true ? 'bg-green-500/20 text-green-400' :
                                                q.opponentCorrect === false ? 'bg-red-500/20 text-red-400' :
                                                    'text-slate-500'
                                                }`}>
                                                {q.opponentAnswer ?? '—'}
                                                {q.opponentCorrect === true ? ' ✓' : q.opponentCorrect === false ? ' ✗' : ''}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
                <button
                    onClick={onRematch}
                    className="px-10 py-4 text-xl font-bold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 transition-transform shadow-lg shadow-blue-500/30"
                >
                    🔄 Rematch
                </button>
                {onHome && (
                    <button
                        onClick={onHome}
                        className="px-10 py-4 text-xl font-bold rounded-full bg-slate-700 hover:bg-slate-600 transition-colors shadow-lg"
                    >
                        🏠 Home
                    </button>
                )}
            </div>
        </div>
    );
}
