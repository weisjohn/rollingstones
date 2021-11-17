import { Gitlab } from "@gitbeaker/node";

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
