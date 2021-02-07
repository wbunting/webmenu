const core = require("@actions/core");
const { getOctokit, context } = require("@actions/github");
const execa = require("execa");
const fs = require("fs");

async function execCommand(command, { cwd }) {
  console.log(`running ${command}`);
  const [cmd, ...args] = command.split(" ");
  return execa(cmd, args, {
    cwd,
    shell: process.env.shell || true,
    windowsHide: true,
    stdio: "inherit",
    env: { FORCE_COLOR: "0" },
  });
}

const main = async () => {
  try {
    const octokit = getOctokit({ auth: process.env.GITHUB_TOKEN });
    // get the release number somehow
    let releaseVersion = core.getInput("tag_name");
    console.log("releaseVersion", releaseVersion);

    // tar the binary
    await execCommand(
      // `tar -czf webmenu_${releaseVersion}_x64.app.tgz ./src-tauri/target/release/webmenu`,
      `tar -czf webmenu_${releaseVersion}_x64.app.tgz ./README.md`,
      {
        cwd: process.cwd(),
      }
    );

    const release = await octokit.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: releaseVersion,
    });

    console.log("release", release);

    await execCommand("ls -a", { cwd: process.cwd() });
    await execCommand("pwd", { cwd: process.cwd() });

    await octokit.repos.uploadReleaseAsset({
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
};

main();
