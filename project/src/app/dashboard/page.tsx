'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatBot } from '@/ext_components/chatbot';

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const treeData: TreeNode = {
  id: 'root',
  label: 'Goal: Become a Software Developer',
  children: [
    {
      id: 'subjects',
      label: 'Subjects',
      children: [
        {
          id: 'cyber-security',
          label: 'Cyber Security',
          children: [
            {
              id: 'classes-cs',
              label: 'Classes',
              children: [
                {
                  id: 'current',
                  label: 'Current Classes',
                  children: []
                },
                {
                  id: 'taken',
                  label: 'Taken Classes',
                  children: [
                    { id: 'cse468', label: 'CSE468' }
                  ]
                },
                {
                  id: 'future',
                  label: 'Future Classes',
                  children: [
                    { id: 'cse360', label: 'CSE360' }
                  ]
                }
              ]
            },
            {
              id: 'events-cs',
              label: 'Events'
            },
            {
              id: 'jobs-cs',
              label: 'Jobs'
            }
          ]
        }
      ]
    }
  ]
};

export default function DashboardPage() {
  const [currentNode, setCurrentNode] = useState<TreeNode>(treeData);
  const [nodeStack, setNodeStack] = useState<TreeNode[]>([]);
  const [selectedLeaf, setSelectedLeaf] = useState<TreeNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clickableAreas = useRef<
    { node: TreeNode; x: number; y: number; width: number; height: number }[]
  >([]);

  const drawTree = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clickableAreas.current = []; 

    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(currentNode.label, canvas.width / 2, 40);

    if (currentNode.children && currentNode.children.length > 0) {
      const numChildren = currentNode.children.length;
      const rectWidth = 200;
      const rectHeight = 50;
      const startX = (canvas.width - rectWidth) / 2;
      const spacing = 20;
      const totalHeight = numChildren * rectHeight + (numChildren - 1) * spacing;
      let startY = (canvas.height - totalHeight) / 2;
      
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';

      currentNode.children.forEach(child => {
        ctx.strokeStyle = 'blue';
        ctx.strokeRect(startX, startY, rectWidth, rectHeight);
        ctx.fillText(child.label, startX + rectWidth / 2, startY + rectHeight / 2 + 6);
        clickableAreas.current.push({
          node: child,
          x: startX,
          y: startY,
          width: rectWidth,
          height: rectHeight
        });
        startY += rectHeight + spacing;
      });
    }
  };

  useEffect(() => {
    drawTree();
  }, [currentNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let area of clickableAreas.current) {
      if (
        clickX >= area.x &&
        clickX <= area.x + area.width &&
        clickY >= area.y &&
        clickY <= area.y + area.height
      ) {
        if (area.node.children && area.node.children.length > 0) {
          setNodeStack(prev => [...prev, currentNode]); // Save the current node for back navigation.
          setCurrentNode(area.node);
        } else {
          setSelectedLeaf(area.node);
        }
        return;
      }
    }
  };

  const handleBack = () => {
    if (nodeStack.length > 0) {
      const newStack = [...nodeStack];
      const previousNode = newStack.pop()!;
      setNodeStack(newStack);
      setCurrentNode(previousNode);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 p-4 w-full">
      {nodeStack.length > 0 && (
        <button
          onClick={handleBack}
          className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Back
        </button>
      )}

      <canvas
        ref={canvasRef}
        className="border border-gray-300"
        onClick={handleCanvasClick}
      />

      {selectedLeaf && (
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white shadow-lg p-4 overflow-auto">
          <button
            onClick={() => setSelectedLeaf(null)}
            className="mb-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
          <h2 className="text-xl font-semibold mb-4">
            {selectedLeaf.label} - Notes & Flashcards
          </h2>
          <p>Meeting notes and flashcards will be generated here.</p>
        </div>
      )}

      <div className='w-full'>
        <div className='fixed bottom-0 w-full'>
          <div className='flex grid-cols-2'>
            <div className='w-full'></div>
            <div className='w-full'><ChatBot /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
