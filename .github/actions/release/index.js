const core = require("@actions/core");
const { getOctokit, context } = require("@actions/github");
const execa = require("execa");
const fs = require("fs");
const exec = require('child_process').exec

async function execCommand(command, { cwd }) {
  console.log(`running ${command}`);
  const [cmd, ...args] = command.split(" ");
  const out = await execa(cmd, args, {
    cwd,
    shell: process.env.shell || true,
    windowsHide: true,
    stdio: "inherit",
    env: { FORCE_COLOR: "0" },
  });
  return out;
}

const main = async () => {
  try {
    const octokit = getOctokit(process.env.GITHUB_TOKEN);
    // get the release number somehow
    let releaseVersion = core.getInput("tag_name");
    console.log("releaseVersion", releaseVersion);

    // tar the binary
    await execCommand(`tar -czvf webmenu_v${releaseVersion}_x64.tar.gz ./target/release/webmenu`, {cwd: process.cwd()});
    await execCommand(`tar -zxvf webmenu_v${releaseVersion}_x64.tar.gz`, {cwd: process.cwd()});
    await execCommand(`ls -l`, {cwd: process.cwd()});
    await execCommand(`tar --version`, {cwd: process.cwd()});

    const release = await octokit.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: `v${releaseVersion}`,
    });

    octokit.repos.uploadReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: release.data.id,
      url: release.data.upload_url,
      name: `webmenu_v${releaseVersion}_x64.tar.gz`,
      data: fs.readFileSync(
        `${process.cwd()}/webmenu_v${releaseVersion}_x64.tar.gz`
      ),
    });
  } catch (error) {
    console.log("error", error.toString());
    core.setFailed(error.message);
  }
};

main();
