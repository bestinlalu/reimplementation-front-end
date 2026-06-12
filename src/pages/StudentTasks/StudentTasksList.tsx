/**
 * StudentTasksList (rendered as the sidebar "StudentTasksBox") — shows three sections:
 *
 * 1. "Tasks not yet started" — assignments where the participant has not submitted
 *    anything yet (notStarted flag set by the backend). Shows days remaining.
 *
 * 2. "Revisions" — assignments currently in a revision stage (revise flag). Each
 *    entry links to /student_review/list/:participantId so the student can act on feedback.
 *
 * 3. "Students who have teamed with you" — fetched independently via GET /student_tasks/team,
 *    which returns { course_name: [full_name, ...] }. Grouped by course with a count badge.
 *    This mirrors the old Expertiza "teamed_students" sidebar panel.
 *
 * The Revision[] prop is derived from the parent's Task[] via extractAssignments() so this
 * component stays stateless with respect to assignment data — it only owns teammate state.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './StudentTasksList.module.css';
import axiosClient from 'utils/axios_client';

export type Revision = {
  name: string;
  dueDate: string;
  revise: boolean;
  notStarted: boolean;
  currentStage: string;
  participantId: number;
};

// Students teamed with data structure: course name -> list of teammate full names
type StudentsTeamedWith = {
  [course: string]: string[];
};

interface StudentTasksListProps {
  revisions: Revision[];
}

const StudentTasksList: React.FC<StudentTasksListProps> = ({ revisions }) => {
  const [studentsTeamedWith, setStudentsTeamedWith] = useState<StudentsTeamedWith>({});
  const [loadingTeammates, setLoadingTeammates] = useState(true);

  useEffect(() => {
    axiosClient
      .get('/student_tasks/team')
      .then((res) => setStudentsTeamedWith(res.data || {}))
      .catch((err) => console.error('Error fetching teammates:', err))
      .finally(() => setLoadingTeammates(false));
  }, []);

  const totalStudents = Object.values(studentsTeamedWith).reduce(
    (sum, students) => sum + students.length,
    0
  );

  // Returns days remaining until dueDate. Returns 0 (not negative) for past dates.
  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  const revisedTasks = revisions.filter((r) => r.revise);
  const notStartedTasks = revisions.filter((r) => r.notStarted);

  return (
    <div className={styles.taskbox}>
      <div className={styles.section}>
        <span className={styles.badge}>{notStartedTasks.length}</span>&nbsp;
        <strong>Tasks not yet started</strong>
        {notStartedTasks.map((task, index) => {
          const daysLeft = calculateDaysLeft(task.dueDate);
          return (
            <div key={index}>
              &raquo; {task.name} {task.currentStage} ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
            </div>
          );
        })}
      </div>

      <div className={styles.section}>
        <span className={styles.greyBadge}>{revisedTasks.length}</span>&nbsp;
        <strong>Revisions</strong>
        {revisedTasks.map((task, index) => {
          const daysLeft = calculateDaysLeft(task.dueDate);
          return (
            <div key={index}>
              &raquo;{' '}
              <Link to={`/student_review/list/${task.participantId}`} className={styles.revisionLink}>
                {task.name} {task.currentStage}
              </Link>
              {' '}({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
            </div>
          );
        })}
      </div>

      <div className={styles.section}>
        <span className={styles.badge}>{totalStudents}</span>&nbsp;
        <strong>Students who have teamed with you</strong>
      </div>

      {loadingTeammates ? (
        <div>Loading teammates...</div>
      ) : Object.keys(studentsTeamedWith).length === 0 ? (
        <div>No teammates found.</div>
      ) : (
        Object.entries(studentsTeamedWith).map(([course, students], index) => (
          <div key={index}>
            <span className={styles.badge}>{students.length}</span>&nbsp;
            <strong>{course}</strong>
            {students.map((student, studentIndex) => (
              <div key={studentIndex}>&raquo; {student}</div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default StudentTasksList;
