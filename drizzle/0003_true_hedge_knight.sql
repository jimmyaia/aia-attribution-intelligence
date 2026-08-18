ALTER TABLE `users` ADD `onboardingStatus` varchar(32) DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingNotes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingUpdatedAt` timestamp;