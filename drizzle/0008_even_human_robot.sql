ALTER TABLE `users` ADD `agencyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `agencyMemberRole` enum('owner','member') DEFAULT 'owner' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `agencyMemberActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `users_agencyId_idx` ON `users` (`agencyId`);