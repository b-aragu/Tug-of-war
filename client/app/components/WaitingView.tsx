export default function WaitingView() {
    return (
        <div className="text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-3xl font-bold">Finding Opponent...</h2>
            <p className="text-slate-400">Get ready to calculate!</p>
        </div>
    );
}
