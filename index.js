import { Gitlab } from "@gitbeaker/node";
import dayjs from 'dayjs';

const api = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: process.env.GITLAB_TOKEN,
});

// the https://gitlab.tangramflex.tech/pro
// const group_id = 118;

// https://gitlab.tangramflex.tech/sandbox/milestone-test
const group_id = 444;

// get all group milestones for this group
let groupMilestones = await api.GroupMilestones.all(group_id);
console.log(groupMilestones);
console.log("groupMilestones.length", groupMilestones.length);

// generates the milestones periods w/ an exclusive date pattern
function generateMilestones() {
  const start = '2022-01-05';
  const sprint_length_weeks = 3;
  const sprint_days = (sprint_length_weeks * 7) - 1;
  const sprints_per_year = Math.floor(52 / sprint_length_weeks);

  return Array(sprints_per_year).fill().map((v, i) => {
    const milestone_start = dayjs(start).add(i * sprint_length_weeks, "weeks");
    return {
      id: group_id,
      title: `22-${i.toString().padStart(2, '0')}`,
      start_date: milestone_start.format("YYYY-MM-DD"),
      due_date: milestone_start.add(sprint_days, "days").format("YYYY-MM-DD"),
    };
  });
}
