import React from 'react';

export default function HashtagText({ text, onHashtagClick }) {
  if (!text) return null;

  // Regex para encontrar hashtags
  const hashtagRegex = /#([a-zA-Z0-9_áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+)/g;
  
  const parts = text.split(hashtagRegex);
  
  return (
    <span>
      {parts.map((part, index) => {
        // Se o índice for ímpar, é uma hashtag (capturada pelo grupo do regex)
        if (index % 2 === 1) {
          return (
            <button
              key={index}
              className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
              onClick={() => onHashtagClick?.(part)}
            >
              #{part}
            </button>
          );
        }
        return part;
      })}
    </span>
  );
}