CREATE POLICY "Users can update invitations matching their email"
ON public.invitations
FOR UPDATE
TO authenticated
USING (lower(email) = lower((select auth.jwt() ->> 'email')))
WITH CHECK (lower(email) = lower((select auth.jwt() ->> 'email')));

CREATE POLICY "Anon can update invitations by email match"
ON public.invitations
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);