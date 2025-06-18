import React, { useEffect, useState } from 'react';
import '../../styles/inputs-Css/MinistryReviews.css';

const MinistryReview = () => {
  const [reviews, setReviews] = useState([]);

  // Simulate data fetching
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        ministryName: "Ministry of Education - Saudi Arabia",
        course: "Mathematics Grade 5",
        reviewedBy: "Dr. Ahmed Al-Harbi",
        status: "Approved",
        remarks: "Aligned with 2025 objectives.",
        date: "2025-05-28",
      },
      {
        id: 2,
        ministryName: "Ministry of Education - UAE",
        course: "Science Grade 7",
        reviewedBy: "Ms. Fatima Al-Nuaimi",
        status: "Pending",
        remarks: "Awaiting final approval.",
        date: "2025-05-29",
      },
      {
        id: 3,
        ministryName: "Ministry of Curriculum Review",
        course: "English Grade 8",
        reviewedBy: "Mr. Khalid Mansoor",
        status: "Rejected",
        remarks: "Revise chapter 4 content.",
        date: "2025-05-30",
      },
    ];

    setReviews(mockData);
  }, []);

  return (
    <div className="ministry-review-wrapper">
      <div className="ministry-review-container">
        <h2>Ministry Review Summary</h2>
        <table className="ministry-review-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ministry</th>
              <th>Course</th>
              <th>Reviewed By</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.id}</td>
                <td>{review.ministryName}</td>
                <td>{review.course}</td>
                <td>{review.reviewedBy}</td>
                <td>
                  <span className={`status-label ${review.status.toLowerCase()}`}>
                    {review.status}
                  </span>
                </td>
                <td>{review.remarks}</td>
                <td>{review.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MinistryReview;
