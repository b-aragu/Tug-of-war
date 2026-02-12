interface RopeProps {
    position: number; // -100 to 100
}

export default function Rope({ position }: RopeProps) {
    // Convert -100..100 to percentage
    // Center is 50%.
    // Range is roughly 10% to 90% visually to keep within bounds
    const percentage = 50 + position / 2.5; // Scaled slightly to keep characters on screen

    return (
        <div className="relative w-full h-40 flex items-center justify-center overflow-hidden bg-gradient-to-b from-sky-300 to-sky-100 rounded-xl border-b-4 border-green-600">
            {/* Background Scenery (Clouds/Grass) */}
            <div className="absolute top-4 left-10 text-4xl opacity-80 animate-pulse">☁️</div>
            <div className="absolute top-8 right-20 text-3xl opacity-60 animate-pulse delay-700">☁️</div>
            <div className="absolute bottom-0 w-full h-4 bg-green-500"></div>

            {/* Zones */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-red-500/20 border-r-4 border-red-500/50 flex items-center justify-center z-0">
                <span className="text-red-600/70 font-black -rotate-90">MUD</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-blue-500/20 border-l-4 border-blue-500/50 flex items-center justify-center z-0">
                <span className="text-blue-600/70 font-black rotate-90">MUD</span>
            </div>

            {/* The Moving Rope Assembly */}
            <div
                className="absolute flex items-end transition-all duration-300 ease-out"
                style={{
                    left: `${percentage}%`,
                    transform: 'translateX(-50%)', // Center the assembly on the point
                    bottom: '20px'
                }}
            >
                {/* Left Team (Player 1) */}
                <div className="flex space-x-1 mr-2 items-end">
                    <div className="text-4xl animate-[pull-left_1s_infinite_alternate]">👦</div>
                    <div className="text-4xl animate-[pull-left_1s_infinite_alternate] delay-100">👧</div>
                    <div className="text-4xl animate-[pull-left_1s_infinite_alternate] delay-200">👦</div>
                </div>

                {/* Rope Center & Flag */}
                <div className="relative flex flex-col items-center">
                    <div className="w-1 h-16 bg-slate-400 mb-[-2px]"></div> {/* Pole */}
                    <div className="absolute top-0 w-8 h-6 bg-red-600 animate-wave origin-left"></div>
                    <div className="w-4 h-4 bg-amber-600 rounded-full z-10"></div> {/* Knot */}
                </div>

                {/* Rope Line (Visual connector) */}
                {/* We need a line connecting the teams. Best done with absolute div behind them? */}
                {/* Simplified: The rope is implied by their hands or we draw a line across */}
                <div className="absolute bottom-3 left-[-100px] right-[-100px] h-1.5 bg-amber-700 -z-10 origin-center rotate-1"></div>


                {/* Right Team (Player 2) */}
                <div className="flex space-x-1 ml-2 items-end">
                    <div className="text-4xl animate-[pull-right_1s_infinite_alternate] delay-200 scale-x-[-1]">👦</div>
                    <div className="text-4xl animate-[pull-right_1s_infinite_alternate] delay-100 scale-x-[-1]">👧</div>
                    <div className="text-4xl animate-[pull-right_1s_infinite_alternate] scale-x-[-1]">👦</div>
                </div>
            </div>

            <style jsx>{`
                @keyframes pull-left {
                    0% { transform: translateX(0) rotate(0deg); }
                    100% { transform: translateX(-5px) rotate(-5deg); }
                }
                @keyframes pull-right {
                    0% { transform: scaleX(-1) translateX(0) rotate(0deg); }
                    100% { transform: scaleX(-1) translateX(-5px) rotate(-5deg); }
                }
                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(10deg); }
                }
            `}</style>
        </div>
    );
}
