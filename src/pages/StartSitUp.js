'use client';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

const StartSitUps = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [sitUpCount, setSitUpCount] = useState(0);
    const positionRef = useRef('up');
    const [debugInfo, setDebugInfo] = useState("");
    const [position, setPosition] = useState("up");
    const lastCountTimeRef = useRef(0);

    useEffect(() => {
        let detector;
        let intervalId;

        const runPoseNet = async () => {
            try {
                await tf.ready();
                await tf.setBackend('webgl');
                detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
                    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
                });
                intervalId = setInterval(() => {
                    detect();
                }, 100);
            } catch (error) {
                console.error("Error in runPoseNet:", error);
                setDebugInfo(`Error: ${error.message}`);
            }
        };

        const detect = async () => {
            if (webcamRef.current && webcamRef.current.video.readyState === 4) {
                const video = webcamRef.current.video;
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                webcamRef.current.video.width = videoWidth;
                webcamRef.current.video.height = videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;

                try {
                    const poses = await detector.estimatePoses(video);
                    if (poses.length > 0) {
                        drawPose(poses[0]);
                        countSitUps(poses[0]);
                    }
                } catch (error) {
                    console.error(error);
                    setDebugInfo(`Error: ${error.message}`);
                }
            }
        };

        const drawPose = (pose) => {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            pose.keypoints.forEach((keypoint) => {
                if (keypoint.score > 0.3) {
                    ctx.beginPath();
                    ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
            adjacentKeyPoints.forEach(([i, j]) => {
                const kp1 = pose.keypoints[i];
                const kp2 = pose.keypoints[j];
                if (kp1.score > 0.3 && kp2.score > 0.3) {
                    ctx.beginPath();
                    ctx.moveTo(kp1.x, kp1.y);
                    ctx.lineTo(kp2.x, kp2.y);
                    ctx.strokeStyle = 'lime';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
        };

        const countSitUps = (pose) => {
            const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
            const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
            const leftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
            const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');

            if (leftKnee && leftHip && leftAnkle && leftShoulder &&
                leftKnee.score > 0.5 && leftHip.score > 0.5 && leftAnkle.score > 0.5 && leftShoulder.score > 0.5) {
                const kneeFlexion = (
                    Math.atan2(leftAnkle.y - leftKnee.y, leftAnkle.x - leftKnee.x) -
                    Math.atan2(leftHip.y - leftKnee.y, leftHip.x - leftKnee.x)
                ) * (180 / Math.PI);

                const kneeFlexionThreshold = 103; // Threshold for knee flexion
                const timeBetweenCounts = 1000; // Time threshold

                setDebugInfo(`Knee Flexion: ${kneeFlexion.toFixed(2)}, Position: ${positionRef.current}`);

                if (positionRef.current === 'up' && kneeFlexion <= kneeFlexionThreshold) {
                    positionRef.current = 'down';
                    const now = Date.now();
                    if (now - lastCountTimeRef.current > timeBetweenCounts) {
                        setSitUpCount(prevCount => prevCount + 1);
                        lastCountTimeRef.current = now;
                        setDebugInfo(prev => `${prev}, Sit-up counted!`);
                    }
                } else if (kneeFlexion > 150) {
                    positionRef.current = 'up';
                    setDebugInfo(prev => `${prev}, Moving up`);
                }
                setPosition(positionRef.current);
            }
        };

        runPoseNet();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="relative w-full max-w-lg mx-auto">
            <Webcam
                ref={webcamRef}
                className="w-full h-auto"
                mirrored={true}
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
            />
            <div className="mt-4 text-xl font-bold">
                Sit-up Count: {sitUpCount}
            </div>
            <div className="mt-2 text-sm">
                Debug Info: {debugInfo}
                <br />
                Position: {position}
            </div>
        </div>
    );
}

export default StartSitUps;
