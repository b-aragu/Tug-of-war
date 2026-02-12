interface HomeViewProps {
    onPlay: () => void;
}

export default function HomeView({ onPlay }: HomeViewProps) {
    return (
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                Tug of War Math
            </h1>
            <p className="text-xl text-slate-300">
                Battle your opponent with the power of math!
            </p>
            <button
                onClick={onPlay}
                className="px-12 py-6 text-2xl font-bold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 transition-transform shadow-lg shadow-blue-500/50"
            >
                PLAY NOW
            </button>
        </div>
    );
}
