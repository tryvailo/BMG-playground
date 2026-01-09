/*
 * -------------------------------------------------------
 * Subscriptions Table for Manual and Stripe Payments
 * Migration: Add subscriptions table to support both manual (UA) and Stripe (EU) payments
 * -------------------------------------------------------
 */

-- Create subscriptions table
create table if not exists public.subscriptions (
    id uuid unique not null default extensions.uuid_generate_v4(),
    account_id uuid not null references public.accounts(id) on delete cascade,
    plan_id varchar(100) not null,
    plan_name varchar(255) not null,
    price decimal(10, 2) not null,
    currency varchar(3) default 'USD',
    billing_interval varchar(20) not null, -- 'month' or 'year'
    payment_method varchar(20) not null, -- 'stripe' or 'manual'
    payment_status varchar(20) not null default 'pending', -- 'pending', 'paid', 'failed', 'canceled'
    invoice_number varchar(100),
    stripe_subscription_id varchar(255), -- For Stripe subscriptions
    stripe_customer_id varchar(255), -- For Stripe customers
    paid_at timestamp with time zone,
    paid_by uuid references auth.users, -- Admin who marked as paid
    expires_at timestamp with time zone,
    canceled_at timestamp with time zone,
    metadata jsonb default '{}'::jsonb, -- Additional data (company name, contact info, etc.)
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    primary key (id)
);

comment on table public.subscriptions is 'Subscriptions for accounts. Supports both Stripe (EU) and manual (UA) payment methods';
comment on column public.subscriptions.payment_method is 'Payment method: stripe for EU, manual for UA';
comment on column public.subscriptions.payment_status is 'Payment status: pending, paid, failed, canceled';
comment on column public.subscriptions.invoice_number is 'Invoice number for manual payments';
comment on column public.subscriptions.metadata is 'Additional data like company name, contact info for manual payments';

-- Create index for faster lookups
create index if not exists subscriptions_account_id_idx on public.subscriptions(account_id);
create index if not exists subscriptions_payment_status_idx on public.subscriptions(payment_status);
create index if not exists subscriptions_payment_method_idx on public.subscriptions(payment_method);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- RLS Policies
-- Users can read their own subscriptions
create policy subscriptions_read_own on public.subscriptions
    for select
    to authenticated
    using (
        account_id = (select auth.uid())
    );

-- Service role can do everything (for admin operations)
grant all on public.subscriptions to service_role;

-- Function to update updated_at timestamp
create or replace function public.update_subscriptions_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_subscriptions_updated_at
    before update on public.subscriptions
    for each row
    execute function public.update_subscriptions_updated_at();






