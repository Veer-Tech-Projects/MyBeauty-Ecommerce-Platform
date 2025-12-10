import { useState } from 'react';

/**
 * Shows a small spinner centred over the image until it loads (or errors).
 * Keeps card height stable so the layout doesn't jump.
 */
export default function ImageWithLoader({ src, alt, className = '', style = {} }) {
  const [ready, setReady] = useState(false);

  return (
    <div className="position-relative" style={{ minHeight: 135, ...style }}>
      {!ready && (
        <div className="d-flex justify-content-center align-items-center position-absolute top-0 bottom-0 start-0 end-0">
          <div className="spinner-border spinner-border-sm text-secondary" role="status" />
        </div>
      )}

      <img
        loading="lazy"
        src={src}
        alt={alt}
        className={className}
        style={ready ? {} : { visibility: 'hidden' }}
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}      // hide spinner even if the image fails
      />
    </div>
  );
}
