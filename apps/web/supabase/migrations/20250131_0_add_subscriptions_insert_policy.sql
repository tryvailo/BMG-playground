/*
 * -------------------------------------------------------
 * Add INSERT policy for subscriptions table
 * Allows authenticated users to create their own subscriptions
 * -------------------------------------------------------
 */

-- Users can create their own subscriptions
create policy subscriptions_insert_own on public.subscriptions
    for insert
    to authenticated
    with check (
        account_id = (select auth.uid())
    );

-- Users can update their own subscriptions (e.g., cancel)
create policy subscriptions_update_own on public.subscriptions
    for update
    to authenticated
    using (
        account_id = (select auth.uid())
    )
    with check (
        account_id = (select auth.uid())
    );
