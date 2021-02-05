const core = require("@actions/core");
const github = require("@actions/github");
const execa = require("execa");

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
  // test
  execCommand("touch test.txt && echo 'hi' >> test.txt", {
    cwd: process.cwd(),
  });

  // tar the binary
  execCommand("tar -czf test.txt.tgz test.txt", { cwd: process.cwd() });

  execCommand("ls -a", { cwd: process.cwd() });
  // upload the binary to the release
} catch (error) {
  core.setFailed(error.message);
}
