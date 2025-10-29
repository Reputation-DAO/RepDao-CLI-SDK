#!/usr/bin/env node
// Educational Platform - Student Progress Tracking

import { awardRep, getBalance, myStats, leaderboard } from 'repdao';
import { predictDecay, analyzeUserComplete } from 'repdao/analytics';
import { identityFromPemFile } from 'repdao/identity';

async function educationalPlatform() {
  console.log('🎓 Educational Platform - Student Progress Tracking\n');
  
  const canisterId = '<your-canister-id>';
  const identity = identityFromPemFile('~/.repdao/education-system.pem');
  const opts = { identity, network: 'ic' };

  // Learning activities and point values
  const learningActivities = {
    'lesson_completed': 20,
    'quiz_passed': 30,
    'assignment_submitted': 50,
    'project_completed': 100,
    'peer_review': 25,
    'forum_participation': 15,
    'study_streak': 40,
    'certification_earned': 200,
    'helping_classmate': 35,
    'extra_credit': 60
  };

  // Course subjects
  const subjects = {
    'mathematics': 'Mathematics',
    'science': 'Science',
    'programming': 'Computer Programming',
    'literature': 'Literature',
    'history': 'History'
  };

  // Student roster
  const students = [
    { id: '<student1-principal>', name: 'Emma Wilson', grade: '10th', subjects: ['mathematics', 'science'] },
    { id: '<student2-principal>', name: 'Liam Chen', grade: '11th', subjects: ['programming', 'mathematics'] },
    { id: '<student3-principal>', name: 'Sophia Rodriguez', grade: '10th', subjects: ['literature', 'history'] },
    { id: '<student4-principal>', name: 'Noah Johnson', grade: '12th', subjects: ['science', 'programming'] }
  ];

  // Simulate learning activities
  const activities = [
    { student: students[0].id, activity: 'lesson_completed', subject: 'mathematics', details: 'Algebra fundamentals' },
    { student: students[0].id, activity: 'quiz_passed', subject: 'mathematics', details: 'Linear equations quiz - 95%' },
    { student: students[1].id, activity: 'project_completed', subject: 'programming', details: 'Built a calculator app' },
    { student: students[1].id, activity: 'helping_classmate', subject: 'programming', details: 'Helped debug code' },
    { student: students[2].id, activity: 'assignment_submitted', subject: 'literature', details: 'Shakespeare essay' },
    { student: students[2].id, activity: 'peer_review', subject: 'literature', details: 'Reviewed 3 essays' },
    { student: students[3].id, activity: 'certification_earned', subject: 'science', details: 'Chemistry Lab Safety' },
    { student: students[0].id, activity: 'study_streak', subject: 'science', details: '7 days consecutive study' },
    { student: students[1].id, activity: 'forum_participation', subject: 'programming', details: 'Active in discussion' },
    { student: students[3].id, activity: 'extra_credit', subject: 'science', details: 'Advanced physics problems' }
  ];

  try {
    console.log('📚 Processing learning activities...\n');

    // Award points for learning activities
    for (const activity of activities) {
      const points = learningActivities[activity.activity];
      const student = students.find(s => s.id === activity.student);
      
      try {
        await awardRep(
          canisterId,
          activity.student,
          BigInt(points),
          `${subjects[activity.subject]}: ${activity.activity} - ${activity.details}`,
          opts
        );
        
        console.log(`✅ ${student?.name}: +${points} points for ${activity.activity} in ${subjects[activity.subject]}`);
      } catch (error) {
        console.log(`❌ Failed to award points to ${student?.name}: ${error.message}`);
      }
    }

    // Generate student progress reports
    console.log('\n📊 Student Progress Reports:\n');
    
    for (const student of students) {
      try {
        const balance = await getBalance(canisterId, student.id, opts);
        const stats = await myStats(canisterId, student.id, opts);
        
        console.log(`🎓 ${student.name} (${student.grade} Grade)`);
        console.log(`   Learning Points: ${balance}`);
        console.log(`   Total Achievements: ${stats.lifetimeAwarded} points`);
        console.log(`   Subjects: ${student.subjects.map(s => subjects[s]).join(', ')}`);
        
        // Calculate GPA equivalent (points to GPA conversion)
        const gpaEquivalent = Math.min(4.0, Number(balance) / 100).toFixed(2);
        console.log(`   GPA Equivalent: ${gpaEquivalent}/4.0`);
        
        // Performance level
        const level = Number(balance) >= 300 ? 'Excellent' :
                     Number(balance) >= 200 ? 'Good' :
                     Number(balance) >= 100 ? 'Satisfactory' : 'Needs Improvement';
        
        console.log(`   Performance Level: ${level}`);
        
        // Predict engagement risk
        try {
          const prediction = await predictDecay(canisterId, student.id, 30, opts);
          const engagementRisk = Number(prediction.projectedBalance) < Number(prediction.currentBalance) * 0.8 ? 'High' : 'Low';
          console.log(`   Engagement Risk (30 days): ${engagementRisk}`);
        } catch (error) {
          console.log(`   Engagement Risk: Unable to calculate`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error generating report for ${student.name}: ${error.message}\n`);
      }
    }

    // Class leaderboard
    console.log('🏆 Class Leaderboard:');
    const classLeaders = await leaderboard(canisterId, 10n, 0n, opts);
    
    classLeaders.forEach(([principal, points], i) => {
      const student = students.find(s => s.id === principal.toString());
      const rank = i + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
      
      if (student) {
        console.log(`${medal} #${rank}: ${student.name} (${student.grade}) - ${points} points`);
      } else {
        console.log(`${medal} #${rank}: ${principal.toString().slice(0, 12)}... - ${points} points`);
      }
    });

    // Subject performance analysis
    console.log('\n📈 Subject Performance Analysis:');
    
    const subjectStats = {};
    
    for (const activity of activities) {
      const subject = activity.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = { activities: 0, totalPoints: 0, students: new Set() };
      }
      
      subjectStats[subject].activities++;
      subjectStats[subject].totalPoints += learningActivities[activity.activity];
      subjectStats[subject].students.add(activity.student);
    }
    
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const avgPoints = Math.round(stats.totalPoints / stats.students.size);
      console.log(`📚 ${subjects[subject]}:`);
      console.log(`   Active students: ${stats.students.size}`);
      console.log(`   Total activities: ${stats.activities}`);
      console.log(`   Average points per student: ${avgPoints}`);
    });

    // Learning insights
    console.log('\n🧠 Learning Insights:');
    
    const totalActivities = activities.length;
    const totalStudents = students.length;
    const activeStudents = new Set(activities.map(a => a.student)).size;
    const engagementRate = Math.round((activeStudents / totalStudents) * 100);
    
    console.log(`• Class engagement rate: ${engagementRate}% (${activeStudents}/${totalStudents} students active)`);
    console.log(`• Total learning activities: ${totalActivities}`);
    console.log(`• Average activities per active student: ${Math.round(totalActivities / activeStudents)}`);
    
    // Most popular activities
    const activityCounts = {};
    activities.forEach(a => {
      activityCounts[a.activity] = (activityCounts[a.activity] || 0) + 1;
    });
    
    const topActivity = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0];
    console.log(`• Most popular activity: ${topActivity[0]} (${topActivity[1]} completions)`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (engagementRate < 80) {
      console.log('• Consider implementing engagement campaigns for inactive students');
    }
    if (activeStudents < totalStudents) {
      console.log('• Reach out to students who haven\'t participated recently');
    }
    console.log('• Encourage peer collaboration and study groups');
    console.log('• Consider bonus points for consistent daily engagement');

  } catch (error) {
    console.error('❌ Educational platform error:', error.message);
  }
}

educationalPlatform();
