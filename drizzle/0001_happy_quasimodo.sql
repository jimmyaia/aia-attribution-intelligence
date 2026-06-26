ALTER TABLE `users` ADD `firstName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `website` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `profileComplete` boolean DEFAULT false NOT NULL;