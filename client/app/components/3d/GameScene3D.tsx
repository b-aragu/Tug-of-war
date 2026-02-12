import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Stars, Environment } from '@react-three/drei';
import Character3D from './Character3D';
import Rope3D from './Rope3D';

interface GameScene3DProps {
    ropePosition: number;
    winner?: 'left' | 'right' | null;
}

export default function GameScene3D({ ropePosition, winner }: GameScene3DProps) {
    const offset = ropePosition / 20;

    // determine props for teams
    let leftPose: 'pulling' | 'idle' | 'victory' | 'defeat' = 'pulling';
    let rightPose: 'pulling' | 'idle' | 'victory' | 'defeat' = 'pulling';

    if (winner === 'left') {
        leftPose = 'victory';
        rightPose = 'defeat';
    } else if (winner === 'right') {
        leftPose = 'defeat';
        rightPose = 'victory';
    }

    return (
        <div className="w-full h-96 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-orange-200 relative">
            <Canvas shadows camera={{ position: [0, 4, 18], fov: 45 }}> {/* Increased Z distance to see more field */}

                {/* Sunset Lighting */}
                <ambientLight intensity={0.5} color="#ffdcae" />
                <directionalLight
                    position={[-10, 5, 5]} // Low angle sun
                    intensity={2}
                    color="#ffaa00"
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <spotLight position={[0, 10, 0]} intensity={0.5} color="#bbaaff" />

                {/* Stylized Sky */}
                <Sky sunPosition={[-10, 2, 0]} turbidity={10} rayleigh={3} mieCoefficient={0.005} mieDirectionalG={0.7} />
                <Stars radius={100} depth={50} count={2000} factor={4} saturation={1} fade speed={0.5} />
                <Environment preset="sunset" />

                {/* Static Ground */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#65a30d" /> {/* More Olive/Warm Green */}
                </mesh>

                {/* Mud Pits - Static Markers of defeat */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, -0.49, 0]} receiveShadow>
                    <circleGeometry args={[2.5, 32]} />
                    <meshStandardMaterial color="#5c4033" /> {/* Dark Brown */}
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, -0.49, 0]} receiveShadow>
                    <circleGeometry args={[2.5, 32]} />
                    <meshStandardMaterial color="#5c4033" />
                </mesh>

                {/* Dynamic Group: Teams + Rope */}
                <group position={[offset, 0, 0]}>
                    <Rope3D position={0} />

                    {/* Left Team (Blue) */}
                    <group position={[-3, 0, 0]}>
                        <Character3D position={[0, 0, 0]} color="#3b82f6" team="left" pose={leftPose} delay={0} />
                        <Character3D position={[-1.2, 0, 0.5]} color="#3b82f6" team="left" pose={leftPose} delay={0.5} />
                        <Character3D position={[-1.2, 0, -0.5]} color="#3b82f6" team="left" pose={leftPose} delay={1.0} />
                    </group>

                    {/* Right Team (Red) */}
                    <group position={[3, 0, 0]}>
                        <Character3D position={[0, 0, 0]} color="#ef4444" team="right" pose={rightPose} delay={0.2} />
                        <Character3D position={[1.2, 0, 0.5]} color="#ef4444" team="right" pose={rightPose} delay={0.7} />
                        <Character3D position={[1.2, 0, -0.5]} color="#ef4444" team="right" pose={rightPose} delay={1.2} />
                    </group>
                </group>
            </Canvas>
        </div>
    );
}
