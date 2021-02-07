const core = require("@actions/core");
const { getOctokit, context } = require("@actions/github");
const execa = require("execa");
const fs = require("fs");

function execCommand(command, { cwd }) {
  console.log(`running ${command}`);
  const [cmd, ...args] = command.split(" ");
  return execa(cmd, args, {
    cwd,
    shell: process.env.shell || true,
    windowsHide: true,
    stdio: "inherit",
    env: { FORCE_COLOR: "0" },
  }).then();
}

try {
  const octokit = getOctokit({ auth: process.env.GITHUB_TOKEN });
  // get the release number somehow
  let releaseVersion = core.getInput("tag_name");
  console.log("releaseVersion", releaseVersion);

  // tar the binary
  execCommand(
    `tar -czf webmenu_${releaseVersion}_x64.app.tgz ./src-tauri/target/release/webmenu`,
    {
      cwd: process.cwd(),
    }
  );

  const release = octokit.repos.getReleaseByTag({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag: releaseVersion,
  });

  execCommand("ls -a", { cwd: process.cwd() });
  execCommand("pwd", { cwd: process.cwd() });

  octokit.repos.uploadReleaseAsset({
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: release.id,
    name: `webmenu_${releaseVersion}_x64.app.tgz`,
    data: fs.readFileSync(
      `${process.cwd()}/webmenu_${releaseVersion}_x64.app.tgz`
    ),
  });
} catch (error) {
  core.setFailed(error.message);
}
