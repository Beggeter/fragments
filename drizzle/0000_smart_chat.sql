CREATE TABLE "booster_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "booster_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"effect" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booster_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "currency_transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "currency_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "record_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"score" integer NOT NULL,
	"level" integer NOT NULL,
	"game_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_boosters" (
	"user_id" integer NOT NULL,
	"booster_type_id" integer NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_boosters_user_id_booster_type_id_pk" PRIMARY KEY("user_id","booster_type_id")
);
--> statement-breakpoint
CREATE TABLE "user_games" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_games_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"board_state" jsonb NOT NULL,
	"current_pieces" jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"telegram_id" varchar(50) NOT NULL,
	"username" varchar(100),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"record" integer DEFAULT 0 NOT NULL,
	"currency" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "currency_transactions" ADD CONSTRAINT "currency_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_history" ADD CONSTRAINT "record_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_boosters" ADD CONSTRAINT "user_boosters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_boosters" ADD CONSTRAINT "user_boosters_booster_type_id_booster_types_id_fk" FOREIGN KEY ("booster_type_id") REFERENCES "public"."booster_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "currency_user_id_idx" ON "currency_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "currency_type_idx" ON "currency_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "currency_created_at_idx" ON "currency_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "record_user_id_idx" ON "record_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "record_score_idx" ON "record_history" USING btree ("score");--> statement-breakpoint
CREATE INDEX "record_created_at_idx" ON "record_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_booster_user_id_idx" ON "user_boosters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_booster_type_idx" ON "user_boosters" USING btree ("booster_type_id");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "user_games" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "telegram_id_idx" ON "users" USING btree ("telegram_id");--> statement-breakpoint
CREATE INDEX "role_idx" ON "users" USING btree ("role");