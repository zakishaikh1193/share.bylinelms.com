import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearchPlus, 
  faSearchMinus, 
  faExpand, 
  faCompress, 
  faChevronLeft, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';

// We'll use the same CSS file
import "./FlipbookViewer.css";

const FlipbookControls = ({
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  currentPage,
  totalPages,
  isRtl,
  isFullscreen,
}) => {
  return (
    <div className="controls-bar">
      {/* Zoom Controls */}
      <button onClick={onZoomOut} className="control-button" title="Zoom Out">
        <FontAwesomeIcon icon={faSearchMinus} />
      </button>
      <button onClick={onZoomIn} className="control-button" title="Zoom In">
        <FontAwesomeIcon icon={faSearchPlus} />
      </button>

      {/* Page Navigation */}
      <div className="page-navigation-controls">
        <button onClick={isRtl ? onNext : onPrev} className="control-button" title={isRtl ? 'Next Page' : 'Previous Page'}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span className="page-info-controls">
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={isRtl ? onPrev : onNext} className="control-button" title={isRtl ? 'Previous Page' : 'Next Page'}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* Fullscreen Toggle */}
      <button onClick={onToggleFullscreen} className="control-button" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
      </button>
    </div>
  );
};

export default FlipbookControls;