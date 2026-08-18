ALTER TABLE `users` ADD `customerId` varchar(7);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_customerId_unique` UNIQUE(`customerId`);