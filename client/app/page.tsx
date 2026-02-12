'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import HomeView from './components/HomeView';
import WaitingView from './components/WaitingView';
import GameView, { QuestionRecord } from './components/GameView';
import ResultView from './components/ResultView';

export type GameState = 'HOME' | 'WAITING' | 'GAME' | 'RESULT';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [gameResult, setGameResult] = useState<{ winnerId: string; ropePosition: number } | null>(null);
  const [questionHistory, setQuestionHistory] = useState<QuestionRecord[]>([]);

  // Initialize Socket
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      if (newSocket.id) setPlayerId(newSocket.id);
    });

    newSocket.on('game_start', () => {
      setQuestionHistory([]); // Reset history for new game
      setGameState('GAME');
    });

    newSocket.on('game_over', (result) => {
      setGameResult(result);
      // Delay switching to result view for victory animation
      setTimeout(() => {
        setGameState('RESULT');
      }, 3000);
    });

    newSocket.on('opponent_disconnected', () => {
      alert('Opponent disconnected!');
      setGameState('HOME');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handlePlayClick = () => {
    if (socket) {
      socket.emit('join_game');
      setGameState('WAITING');
    }
  };

  const handleRematchClick = () => {
    if (socket) {
      socket.emit('rematch');
      setQuestionHistory([]);
      setGameState('WAITING');
    }
  };

  const handleGoHome = () => {
    setGameResult(null);
    setQuestionHistory([]);
    setGameState('HOME');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white font-sans overflow-hidden">
      {gameState === 'HOME' && <HomeView onPlay={handlePlayClick} />}
      {gameState === 'WAITING' && <WaitingView />}
      {gameState === 'GAME' && socket && (
        <GameView
          socket={socket}
          playerId={playerId}
          onQuestionHistory={(history) => setQuestionHistory(history)}
          onQuit={handleGoHome}
        />
      )}
      {gameState === 'RESULT' && gameResult && (
        <ResultView
          result={gameResult}
          playerId={playerId}
          onRematch={handleRematchClick}
          onHome={handleGoHome}
          questionHistory={questionHistory}
        />
      )}
    </main>
  );
}
