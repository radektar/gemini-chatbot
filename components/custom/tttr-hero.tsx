"use client";

import React from "react";
import { motion } from "framer-motion";
import { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai";
import { MultimodalInput } from "./multimodal-input";
import { QuickActions } from "./quick-actions";
import Image from "next/image";

/**
 * TTTR Hero Component
 * 
 * Displays the TTTR branded hero section with colorful mosaic shapes.
 * Based on Figma design node 13801-20332 and 13839-15504.
 * Visible only on start screen (when no messages exist).
 * Background color is applied at the page level (chat.tsx).
 * 
 * Mosaic shapes are organic SVG polygons from TTTR design system,
 * positioned on left and right sides to frame the central content.
 */

// Shape configuration for mosaic elements
const mosaicShapes = {
  green: { src: "/images/mosaic/shape-green.svg", width: 181, height: 199 },
  pink: { src: "/images/mosaic/shape-pink.svg", width: 298, height: 223 },
  yellow: { src: "/images/mosaic/shape-yellow.svg", width: 217, height: 195 },
  purple: { src: "/images/mosaic/shape-purple.svg", width: 202, height: 242 },
  blue: { src: "/images/mosaic/shape-blue.svg", width: 289, height: 283 },
  coral: { src: "/images/mosaic/shape-coral.svg", width: 262, height: 261 },
};

export const TTTRHero = ({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
}: {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: React.Dispatch<React.SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}) => {
  return (
    <div className="w-full flex-1 flex items-center justify-center">
      {/* Max-width container for large screens */}
      <motion.div
        key="tttr-hero"
        className="w-full max-w-[1600px] flex-1 flex items-center justify-center px-8 md:px-16 xl:px-24 2xl:px-32 py-8 relative overflow-hidden mx-auto min-h-[calc(100vh-80px)]"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ delay: 0.2 }}
      >
        {/* Left Mosaic Column - shapes with consistent gap */}
        <div className="absolute left-0 top-0 bottom-0 w-[280px] xl:w-[320px] 2xl:w-[380px] pointer-events-none hidden lg:flex lg:flex-col lg:items-start lg:justify-center lg:gap-[48px] overflow-hidden">
          {/* Green Shape */}
          <motion.div 
            className="ml-[15%]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Image
              src={mosaicShapes.green.src}
              alt=""
              width={110}
              height={121}
              className="rotate-[-15deg]"
              priority
            />
          </motion.div>

          {/* Yellow Shape */}
          <motion.div 
            className="ml-[5%]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Image
              src={mosaicShapes.yellow.src}
              alt=""
              width={120}
              height={108}
              className="rotate-[8deg]"
              priority
            />
          </motion.div>

          {/* Blue Shape */}
          <motion.div 
            className="ml-[10%]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Image
              src={mosaicShapes.blue.src}
              alt=""
              width={140}
              height={137}
              className="rotate-[-5deg]"
              priority
            />
          </motion.div>
        </div>

        {/* Right Mosaic Column - shapes with consistent gap */}
        <div className="absolute right-0 top-0 bottom-0 w-[280px] xl:w-[320px] 2xl:w-[380px] pointer-events-none hidden lg:flex lg:flex-col lg:items-end lg:justify-center lg:gap-[48px] overflow-hidden">
          {/* Pink Shape */}
          <motion.div 
            className="mr-[10%]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Image
              src={mosaicShapes.pink.src}
              alt=""
              width={130}
              height={97}
              className="rotate-[180deg]"
              priority
            />
          </motion.div>

          {/* Purple Shape */}
          <motion.div 
            className="mr-[15%]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Image
              src={mosaicShapes.purple.src}
              alt=""
              width={100}
              height={120}
              className="rotate-[-10deg]"
              priority
            />
          </motion.div>

          {/* Coral Shape */}
          <motion.div 
            className="mr-[8%]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Image
              src={mosaicShapes.coral.src}
              alt=""
              width={130}
              height={130}
              className="rotate-[5deg]"
              priority
            />
          </motion.div>
        </div>

      {/* Centered Content Section */}
      <div className="flex flex-col gap-8 items-center justify-center relative max-w-[700px] text-center z-10">
        {/* Header Section */}
        <div className="flex flex-col gap-4 items-center relative w-full">
          <h1 className="font-primary font-bold leading-[1.2] relative text-tttr-text-heading text-4xl md:text-[52px] tracking-[-2.08px]">
            Find projects, generate narratives, match partners.
          </h1>
        </div>

        {/* Description */}
        <div className="font-secondary font-normal leading-[1.5] relative text-tttr-text-heading text-base md:text-lg tracking-[-0.54px] max-w-[600px]">
          <p>Currently synced to Monday and Slack</p>
        </div>

        {/* Input Form */}
        <form className="flex flex-row gap-2 relative items-end w-full max-w-[600px] mt-8">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
          />
        </form>

        {/* Quick Actions */}
        <QuickActions onActionClick={append} />
      </div>
    </motion.div>
    </div>
  );
};
