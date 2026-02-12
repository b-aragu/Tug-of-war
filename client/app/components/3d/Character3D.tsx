import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import * as THREE from 'three';

interface Character3DProps {
    position: [number, number, number];
    color: string;
    team: 'left' | 'right';
    isPulling: boolean;
    delay?: number;
    pose: 'idle' | 'pulling' | 'victory' | 'defeat';
}

export default function Character3D({ position, color, team, isPulling, delay = 0, pose }: Character3DProps) {
    const group = useRef<Group>(null);
    const { scene } = useGLTF('/boy.glb');

    // Clone the scene for each instance
    const clone = useMemo(() => {
        const clonedScene = scene.clone();

        // Simple material tinting - this might color skin too, but it's a quick way to show teams
        // Ideally we'd find the "Shirt" mesh by name.
        clonedScene.traverse((child) => {
            if ((child as Mesh).isMesh) {
                const m = child as Mesh;
                // Clone material to avoid sharing across all instances
                if (Array.isArray(m.material)) {
                    m.material = m.material.map(mat => mat.clone());
                    // Don't tint texture based models blindly, but let's try emissive or standard color if it's simple
                } else {
                    m.material = (m.material as THREE.Material).clone();
                }

                // Enable shadows
                m.castShadow = true;
                m.receiveShadow = true;

                // Hack: If explicit color was passed (red/blue), try to tint.
                // But we don't want to turn the whole kid blue.
                // Let's just leave the model as is for now, and rely on position/direction.
                // OR: Traverse and look for "Body" or "Shirt" if standard naming.
                // user said "use it on both sides". 
            }
        });
        return clonedScene;
    }, [scene]);

    useFrame((state) => {
        if (!group.current) return;
        const time = state.clock.getElapsedTime();

        // 1. POSE LOGIC
        if (pose === 'victory') {
            // Jump up and down
            const jump = Math.abs(Math.sin(time * 5 + delay));
            group.current.position.y = position[1] + (jump * 0.5);
            group.current.rotation.z = Math.sin(time * 10) * 0.05; // Wiggle

            // Look forward
            group.current.rotation.x = 0;

        } else if (pose === 'defeat') {
            // Fall over
            // Rotate towards back
            const fallDir = team === 'left' ? 1 : -1;
            // Target rotation
            const targetRot = Math.PI / 2 * fallDir;
            // We can just set it static for now or lerp.
            group.current.rotation.z = Math.PI / 2 * (team === 'left' ? -1 : 1); // Fall backwards relative to team
            // Fix Y to be on ground
            group.current.position.y = 0.2;

        } else if (pose === 'pulling') {
            // Heave back and forth
            const t = time * 3 + delay;
            // Lean back
            // Left team (faces +X) leans back (-X) -> Rotation Z +?
            // Right team (faces -X) leans back (+X) -> Rotation Z -?

            const baseLean = team === 'left' ? 0.3 : -0.3;
            const heave = Math.sin(t) * 0.1;
            group.current.rotation.z = baseLean + heave;

            group.current.position.y = position[1]; // Reset Y

        } else {
            // Idle
            group.current.rotation.z = 0;
            group.current.position.y = position[1];
            // Breathing
            group.current.scale.y = 1 + Math.sin(time * 2) * 0.02;
        }
    });

    // Initial orientation:
    // If model faces +Z (Standard), we need to rotate it to face +X or -X along rope.
    // team 'left' needs to face +X. Rotate Y = Math.PI / 2.
    // team 'right' needs to face -X. Rotate Y = -Math.PI / 2.

    const facingRotation = team === 'left' ? Math.PI / 2 : -Math.PI / 2;

    return (
        <group ref={group} position={position} dispose={null}>
            {/* Nest visual in a group to handle local rotation separate from "Actor" logic if needed */}
            <primitive
                object={clone}
                rotation={[0, facingRotation, 0]}
                scale={2.5} // Increased scale as requested
            />
        </group>
    );
}

useGLTF.preload('/boy.glb');
