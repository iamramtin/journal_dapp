// One account for journal metadata
// Separate account for each entry, with a PDA derived from the journal address and entry ID
// When adding an entry: create a new account with init
// When updating: modify just that entry's account
// When deleting: close the entry account and return rent to owner

// Virtually unlimited entries (not constrained by a single account's size)
// More efficient updates - only the affected entry needs to be serialized/deserialized
// Can reclaim rent when deleting entries (via close)
// Better for partial data access - clients can fetch only the entries they need
// Potentially higher initial cost (more accounts = more rent)

#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("EnomEJjzkSXyDuWgP817RqTEVPqhe6izm71zkvScVjP9");

const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod journal {
    use super::*;

    pub fn create_journal(ctx: Context<CreateJournal>, title: String) -> Result<()> {
        let journal = &mut ctx.accounts.journal;

        journal.owner = ctx.accounts.owner.key();
        journal.title = title;
        journal.entry_count = 0;

        msg!("New Journal Created: {}", journal.title);

        Ok(())
    }

    pub fn delete_journal(ctx: Context<DeleteJournal>) -> Result<()> {
        msg!("Journal Deleted: {}", ctx.accounts.journal.title);
        Ok(())
    }

    pub fn create_journal_entry(ctx: Context<CreateEntry>, content: String) -> Result<()> {
        let journal = &mut ctx.accounts.journal;
        let entry = &mut ctx.accounts.entry;

        let entry_id = journal.entry_count;

        journal.entry_count = journal.entry_count.checked_add(1).unwrap();

        entry.journal = journal.key();
        entry.id = entry_id;
        entry.content = content;
        entry.timestamp = Clock::get()?.unix_timestamp;

        msg!("Journal Entry Created: {} / {}", journal.title, entry_id);

        Ok(())
    }

    pub fn update_journal_entry(ctx: Context<UpdateEntry>, content: String) -> Result<()> {
        let journal = &mut ctx.accounts.journal;
        let entry = &mut ctx.accounts.entry;

        entry.content = content;
        entry.timestamp = Clock::get()?.unix_timestamp;

        msg!("Journal Entry Updated: {} / {}", journal.title, entry.id);

        Ok(())
    }

    pub fn delete_journal_entry(ctx: Context<DeleteEntry>) -> Result<()> {
        let journal = &ctx.accounts.journal;
        let entry = &ctx.accounts.entry;

        msg!("Journal Entry Deleted: {} / {}", journal.title, entry.id);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateJournal<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Journal::INIT_SPACE,
        seeds = [b"journal", owner.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub journal: Account<'info, Journal>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteJournal<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        seeds = [b"journal", owner.key().as_ref(), journal.title.as_bytes()],
        bump,
        has_one = owner,
    )]
    pub journal: Account<'info, Journal>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(content: String)]
pub struct CreateEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"journal", owner.key().as_ref(), journal.title.as_bytes()],
        bump,
        has_one = owner
    )]
    pub journal: Account<'info, Journal>,

    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + JournalEntry::INIT_SPACE,
        seeds = [b"entry", journal.key().as_ref(), journal.entry_count.to_le_bytes().as_ref()],
        bump
    )]
    pub entry: Account<'info, JournalEntry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"journal", owner.key().as_ref(), journal.title.as_bytes()],
        bump,
        has_one = owner
    )]
    pub journal: Account<'info, Journal>,

    #[account(
        mut,
        seeds = [b"entry", journal.key().as_ref(), entry.id.to_le_bytes().as_ref()],
        bump,
        constraint = entry.journal == journal.key()
    )]
    pub entry: Account<'info, JournalEntry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"journal", owner.key().as_ref(), journal.title.as_bytes()],
        bump,
        has_one = owner
    )]
    pub journal: Account<'info, Journal>,

    #[account(
        mut,
        close = owner,
        seeds = [b"entry", journal.key().as_ref(), entry.id.to_le_bytes().as_ref()],
        bump,
        constraint = entry.journal == journal.key()
    )]
    pub entry: Account<'info, JournalEntry>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Journal {
    pub owner: Pubkey,
    #[max_len(30)]
    pub title: String,
    pub entry_count: u8,
}

#[account]
#[derive(InitSpace)]
pub struct JournalEntry {
    pub journal: Pubkey,
    pub id: u8,
    pub timestamp: i64,
    #[max_len(280)]
    pub content: String,
}

#[error_code]
pub enum JournalError {
    #[msg("Journal title is too long")]
    TitleTooLong,
    #[msg("Journal entry content is too long")]
    ContentTooLong,
    #[msg("Only the journal owner can perform this action")]
    Unauthorized,
}
