class OmoClaw < Formula
  desc "Installer wrapper for the omo claw OpenClaw plugin"
  homepage "https://github.com/Her-xanadu/omo-claw"
  license "MIT"
  head "https://github.com/Her-xanadu/omo-claw.git", branch: "main"

  def install
    libexec.install Dir["*"]

    (bin/"omo-claw-install").write <<~SH
      #!/bin/sh
      exec "#{libexec}/scripts/install-plugin.sh" "$@"
    SH
    chmod 0555, bin/"omo-claw-install"
  end

  def caveats
    <<~EOS
      `omo claw` is an OpenClaw plugin project, not a standalone desktop app.

      Typical usage:
        omo-claw-install /path/to/your/openclaw/plugins/omo-claw

      After install:
        1. Register `openclaw.plugin.json` with OpenClaw
        2. Use plugin id `omo-claw`
        3. Start `integration/bridge-runtime/bridge-launcher.sh`
    EOS
  end

  test do
    assert_match "Usage: omo-claw-install", shell_output("#{bin}/omo-claw-install --help")
  end
end
