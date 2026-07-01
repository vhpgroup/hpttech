import * as migration_20260626_041300_add_certifications from './20260626_041300_add_certifications';
import * as migration_20260701_082156_pseo_landing_pages from './20260701_082156_pseo_landing_pages';

export const migrations = [
  {
    up: migration_20260626_041300_add_certifications.up,
    down: migration_20260626_041300_add_certifications.down,
    name: '20260626_041300_add_certifications',
  },
  {
    up: migration_20260701_082156_pseo_landing_pages.up,
    down: migration_20260701_082156_pseo_landing_pages.down,
    name: '20260701_082156_pseo_landing_pages'
  },
];
