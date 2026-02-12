interface KeypadProps {
    onInput: (digit: string) => void;
    onClear: () => void;
    onSubmit: () => void;
}

export default function Keypad({ onInput, onClear, onSubmit }: KeypadProps) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];

    return (
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
            {keys.map((key) => (
                <button
                    key={key}
                    onClick={() => {
                        if (key === 'C') onClear();
                        else if (key === '✓') onSubmit();
                        else onInput(key);
                    }}
                    className={`
            h-16 text-2xl font-bold rounded-xl shadow-md active:scale-95 transition-transform
            ${key === 'C' ? 'bg-red-500 hover:bg-red-600' : ''}
            ${key === '✓' ? 'bg-green-500 hover:bg-green-600' : ''}
            ${key !== 'C' && key !== '✓' ? 'bg-slate-700 hover:bg-slate-600' : ''}
          `}
                >
                    {key}
                </button>
            ))}
        </div>
    );
}
