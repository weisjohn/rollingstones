import { Gitlab } from "@gitbeaker/node";
import dayjs from 'dayjs';
import lo from 'lodash';

// helper for waiting
function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

const api = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: process.env.GITLAB_TOKEN,
});

// the https://gitlab.tangramflex.tech/pro
// const group_id = 118;

// https://gitlab.tangramflex.tech/sandbox/milestone-test
const group_id = 444;

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
      title: `22-${(i+1).toString().padStart(2, '0')}`,
      start_date: milestone_start.format("YYYY-MM-DD"),
      due_date: milestone_start.add(sprint_days, "days").format("YYYY-MM-DD"),
    };
  });
}

// only create milestones if they don't already exist, use the title property
async function getMilestonesToCreate(desired) {
  // get all group milestones for this group
  const groupMilestones = await api.GroupMilestones.all(group_id);
  return lo.differenceBy(desired, groupMilestones, "title");
}

var create = await getMilestonesToCreate(generateMilestones())
console.log('\nMilestones to be created:');
console.table(create, ['title', 'start_date', 'due_date']);
console.log();

const proceed = process.argv.includes('--yes');
if (!proceed) {
  console.log('Should we proceed?')
  console.log('To create the milestones, set `--yes`');
  process.exit(1);
}

// create milestones
for (const milestone of create) {
  await delay(1);
  const { id, title } = milestone;
  const res = await api.GroupMilestones.create(id, title, milestone);
  console.log(`Milestone created: ${res.web_url}`);
}
