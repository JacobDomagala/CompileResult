const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  try {
    const result_in = core.getInput('compile_result');

    await create_or_update_comment(await find_comment_id(), process_compile_output(result_in));

    core.setOutput("time", 0);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();

function process_compile_output(compile_result) {
  const prefix = "/home/runner/work/DGame/DGame/";
  const str_begin_len = prefix.length;
  const splitLines = str => str.split(/\r?\n/);
  var matchingStrings = [];
  arrayOfLines = splitLines(compile_result);
  arrayOfLines.forEach(item => {
    var idx = item.indexOf(prefix);

    // Only consider lines that start with 'prefix'
    if (idx == 0) {
      // Retrive first occurence of ':'
      file_path_end_idx = item.indexOf(":");

      // Retrive file path (without github worker dir)
      file_path = item.substring(str_begin_len, file_path_end_idx);

      // Retrive line number of warning/error
      const file_name_offset = file_path_end_idx + 1;
      file_line_start = item.substring(file_name_offset, file_name_offset + item.substring(file_name_offset).indexOf(":"));
      file_line_end = (parseInt(file_line_start) + 3).toString();

      // warning/error description
      description = item.substring(item.indexOf(" "));

      var new_line = `https://github.com/${github.context.issue.owner}/${github.context.issue.repo}/blob/${github.context.sha}/${file_path}#L${file_line_start}-L${file_line_end}`;

      matchingStrings.push(new_line);
      matchingStrings.push(description);
    }
  });

  return matchingStrings.join('\n');
}

async function find_comment_id() {
  const octokit = github.getOctokit(core.getInput("token"));

  await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/commits', {
    owner: github.context.issue.owner,
    repo: github.context.issue.repo,
    pull_number: core.getInput("pr_number")
  });

  return -1;
}

async function create_or_update_comment(comment_id, comment_body) {
  const octokit = github.getOctokit(core.getInput("token"));

  const pr_num = core.getInput("pr_number");
  const token = core.getInput("token");

  console.log(`Token ${token}`);
  console.log(`PR number ${pr_num}`);
  console.log("Repo " + github.context.issue.repo);
  console.log("Owner " + github.context.issue.owner);
  console.log(`Comment_ID ${comment_id}`);

  // Create comment
  if (comment_id == -1) {
    await octokit.issues.createComment({
      owner: github.context.issue.owner,
      repo: github.context.issue.repo,
      issue_number: pr_num,
      body: comment_body,
    });
  }
  // Update comment
  else {
    await octokit.issues.updateComment({
      owner: github.context.issue.owner,
      repo: github.context.issue.repo,
      comment_id: comment_id,
      body: comment_body,
    });
  }
}
