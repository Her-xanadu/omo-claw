# Security Policy

If you discover a security issue in `omo claw`, please do not open a public issue with exploit details.

Instead:

1. prepare a minimal reproduction and impact summary
2. contact the maintainer privately through GitHub security reporting or private contact
3. allow time for triage and coordinated disclosure before public release

Sensitive areas include:

- runtime secret handling
- permission approval flow
- event stream isolation across directories
- generated artifacts that may accidentally expose local metadata
