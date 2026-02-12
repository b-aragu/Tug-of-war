import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';

interface Rope3DProps {
    position: number; // -100 to 100
}

export default function Rope3D({ position }: Rope3DProps) {
    const group = useRef<Group>(null);

    useFrame(() => {
        if (group.current) {
            // Target X position: map -100..100 to -10..10 world units?
            // Let's say world is roughly 20 units wide.
            // -100 -> -5, 100 -> 5
            const targetX = position / 20;

            // Lerp for smoothness
            group.current.position.x += (targetX - group.current.position.x) * 0.1;
        }
    });

    return (
        <group>
            {/* The Rope Itself (Static length, moves with group? No, rope stays, flag moves? 
                Realistically, rope moves. 
                If rope moves, ends go off screen.
            */}

            <group ref={group}>
                <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.5, 0]} castShadow receiveShadow>
                    {/* Long rope: 40 units long, radius 0.05 */}
                    <cylinderGeometry args={[0.05, 0.05, 40, 8]} />
                    <meshStandardMaterial color="#8B4513" /> {/* SaddleBrown */}
                </mesh>

                {/* Center Flag */}
                <group position={[0, 0.5, 0]}>
                    {/* Knot */}
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color="orange" />
                    </mesh>

                    {/* Flag Cloth */}
                    <mesh position={[0, -0.4, 0]}>
                        <boxGeometry args={[0.02, 0.8, 0.6]} />
                        <meshStandardMaterial color="red" />
                    </mesh>
                </group>
            </group>
        </group>
    );
}
