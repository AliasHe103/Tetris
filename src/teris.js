import {useEffect, useRef, useState} from "react";
import {animationControls, motion, useAnimationControls} from "framer-motion"

export function Block({top, left, handleClick}) {
    return (
        <span className={"blockBorder"} style={{position: "absolute", top: `${top}px`, left: `${left}px`}}>
          <span className={"innerBlock"}>
          </span>
        </span>
    );
}

export function Blocks() {
    const [rotation, setRotation] = useState(0);
    const blocksRef = useRef(null);
    const blockRefs = Array(4).fill(useRef(null));//error
    const [childBlock, setChildBlock] = useState([
        {id: 0, bottom: "0px"},
        {id: 1, bottom: "0px"},
        {id: 2, bottom: "0px"},
        {id: 3, bottom: "0px"},
    ]);

    const updateBottom = (id, bottom) => {
        setChildBlock(childBlock.map(block => block.id === id ? {id: id, bottom: bottom} : block));
    };

    useEffect(() => {
        let frames = 0;
        const interval = setInterval(() => {
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            console.log('width', windowWidth);
            const rects = blockRefs.map((ref) => ref.current.getBoundingClientRect());
            const maxIndex = rects.reduce((maxIndex, current, index) => {
                return current.bottom > rects[maxIndex].bottom ? index : maxIndex;
            }, 0);
            console.log('rects[maxIndex].bottom', rects[maxIndex].bottom);
            if (frames <= 10 && rects[maxIndex].bottom < windowHeight) {
                updateBottom(0, `${-frames * windowHeight / 10}px`);
                // blocksRef.current.style.bottom = `${windowHeight - frames * windowHeight / 10}px`;
                frames++;
            }
            else {
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    },[]);

    return (
        <span
            style={{position: "absolute", bottom: `${window.innerHeight}px`, transform: `rotate(${rotation}deg)`}}
            className={"blocks kind1"}
            ref={blocksRef}
            onClick={() => setRotation((rotation) => rotation + 90)}
        >
            {childBlock.map((block) => <Block key={block.id} style={{bottom: block.bottom}} blockRef={blockRefs[block.id]}></Block>)}
        </span>
    );
}