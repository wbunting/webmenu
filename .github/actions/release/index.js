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

const main = async () => {
  try {
    const octokit = getOctokit(process.env.GITHUB_TOKEN);
    // get the release number somehow
    let releaseVersion = core.getInput("tag_name");
    console.log("releaseVersion", releaseVersion);

    // tar the binary
    execCommand(`tar -czf webmenu_v${releaseVersion}_x64.app.tgz ./webmenu`, {
      cwd: `${process.cwd()}/src-tauri/target/release`,
    });
    execCommand(`mv webmenu_v${releaseVersion}_x64.app.tgz ${process.cwd()}`, {
      cwd: `${process.cwd()}/src-tauri/target/release`,
    });
    execCommand(`tar -zxvf webmenu_v${releaseVersion}_x64.app.tgz`, {
	    cwd: process.cwd(),
    });
    execCommand(`ls -l`, {cwd: process.cwd()});

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
      name: `webmenu_v${releaseVersion}_x64.app.tgz`,
      data: fs.readFileSync(
        `${process.cwd()}/webmenu_v${releaseVersion}_x64.app.tgz`
      ),
    });
  } catch (error) {
    console.log("error", error.toString());
    core.setFailed(error.message);
  }
};

main();
