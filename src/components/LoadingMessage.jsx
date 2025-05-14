import React, { useState, useEffect } from 'react';

const LoadingMessage = () => {
  const messages = ["Please wait...", "Loading...", "Validating data...", "Processing request...", "Almost there..."];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2000); 

    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <p className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text animate-pulse">
      {messages[currentMessageIndex]}
    </p>
  );
};

export default LoadingMessage;
