import { SetMetadata } from '@nestjs/common';

export const REQUIRE_STEP_UP_KEY = 'requireStepUp';

/** Marks a route as requiring a recent TOTP step-up (within 5 minutes). */
export const RequireStepUp = () => SetMetadata(REQUIRE_STEP_UP_KEY, true);
