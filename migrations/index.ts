import * as migration_20260626_041300_add_certifications from "./20260626_041300_add_certifications";

export const migrations = [
  {
    up: migration_20260626_041300_add_certifications.up,
    down: migration_20260626_041300_add_certifications.down,
    name: "20260626_041300_add_certifications",
  },
];
