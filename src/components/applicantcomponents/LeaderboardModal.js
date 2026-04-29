import React from 'react';
import './LeaderboardModal.css';
import badge1 from '../../images/LeaderBoardBadges/1.png';
import badge2 from '../../images/LeaderBoardBadges/2.png';
import badge3 from '../../images/LeaderBoardBadges/3.png';

const LeaderboardModal = ({ isOpen, onClose, leaderboard, loading, imageMap, defaultAvatarImg }) => {
  if (!isOpen) return null;

  const medals = [badge1, badge2, badge3];

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num) => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
  };
  
  // Get top 3 for the podium
  const topThree = leaderboard.slice(0, 3);
  // Rest of the leaderboard
  const restLeaders = leaderboard.slice(3);

  return (
    <div className="leaderboard-modal-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="leaderboard-modal-header">
          <h2>Our Leaderboard</h2>
          <button className="leaderboard-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Top 3 Podium */}
        <div className="leaderboard-modal-podium">
          {topThree.map((entry, index) => (
            <div key={entry.applicantId} className={`podium-item rank-${index + 1}`}>
              <div className="podium-avatar-wrapper">
                <img 
                  src={imageMap[entry.applicantId] || defaultAvatarImg}
                  alt={entry.name}
                  className="podium-avatar"
                />
                <img src={medals[index]} alt={`Rank ${index + 1}`} className="podium-medal" />
              </div>
              <div className="podium-info">
                <span className="podium-name">{entry.name?.split(' ')[0]}</span>
                <span className="podium-score">({entry.score})</span>
              </div>
            </div>
          ))}
        </div>

        {/* List Section */}
        <div className="leaderboard-modal-list">
          {/* Header Row */}
          <div className="leaderboard-list-header">
            <span className="header-rank">Rank</span>
            <span className="header-name">Name</span>
            <span className="header-score">Score</span>
          </div>
          {loading ? (
            <div className="leaderboard-modal-loading">Loading...</div>
          ) : (
            restLeaders.map((entry, index) => {
              const actualRank = index + 4; // Since we start from 4th position
              const suffix = getOrdinalSuffix(actualRank);
              return (
                <div key={entry.applicantId} className="leaderboard-list-item">
                  <span className="list-rank">
                    <span className="rank-number">{actualRank}</span>
                    <span className="rank-suffix">{suffix}</span>
                  </span>
                  <div className="list-avatar">
                    <img 
                      src={imageMap[entry.applicantId] || defaultAvatarImg}
                      alt={entry.name}
                    />
                  </div>
                  <span className="list-name">{entry.name}</span>
                  <span className="list-score">{entry.score}</span>
                </div>
              );
            })
          )}
        </div>

        {/* View More Link */}
        {/* <div className="leaderboard-modal-footer">
          <span className="view-more-link">View more</span>
        </div> */}
      </div>
    </div>
  );
};

export default LeaderboardModal;
