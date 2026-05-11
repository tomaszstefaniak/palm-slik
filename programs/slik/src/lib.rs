use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("CogFZCvMEXKpvg2okzEUQMLAeTRqwdC9v7JXE8CHvzNP");

const FEE_WALLET: Pubkey = pubkey!("2df3JmriVkhkBqdmYT2TgDBRo8E71WAJE1SbtLQ71Fkc");
const FEE_BPS: u64 = 20; // 0.2% = 20 basis points
// Palm USD mainnet mint
const STABLE_MINT: Pubkey = pubkey!("CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s");

#[program]
pub mod slik {
    use super::*;

    pub fn pay(ctx: Context<Pay>, amount: u64, payment_id: [u8; 16]) -> Result<()> {
        require!(amount > 0, SlikError::ZeroAmount);

        let fee_amount = amount.checked_mul(FEE_BPS).unwrap().checked_div(10000).unwrap();
        let net_amount = amount.checked_sub(fee_amount).unwrap();

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.customer.to_account_info(),
                    to: ctx.accounts.merchant.to_account_info(),
                },
            ),
            net_amount,
        )?;

        if fee_amount > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.customer.to_account_info(),
                        to: ctx.accounts.fee_wallet.to_account_info(),
                    },
                ),
                fee_amount,
            )?;
        }

        let receipt = &mut ctx.accounts.receipt;
        receipt.customer = ctx.accounts.customer.key();
        receipt.merchant = ctx.accounts.merchant.key();
        receipt.mint = Pubkey::default(); // SOL has no mint
        receipt.decimals = 9; // SOL decimals
        receipt.amount = amount;
        receipt.fee_amount = fee_amount;
        receipt.net_amount = net_amount;
        receipt.refunded_amount = 0;
        receipt.payment_id = payment_id;
        receipt.timestamp = Clock::get()?.unix_timestamp;
        receipt.bump = ctx.bumps.receipt;

        emit!(PaymentCompleted {
            payment_id,
            customer: ctx.accounts.customer.key(),
            merchant: ctx.accounts.merchant.key(),
            mint: Pubkey::default(),
            decimals: 9,
            amount,
            fee_amount,
            net_amount,
            timestamp: receipt.timestamp,
        });

        Ok(())
    }

    pub fn pay_stable(ctx: Context<PayStable>, amount: u64, payment_id: [u8; 16]) -> Result<()> {
        require!(amount > 0, SlikError::ZeroAmount);

        let fee_amount = amount.checked_mul(FEE_BPS).unwrap().checked_div(10000).unwrap();
        let net_amount = amount.checked_sub(fee_amount).unwrap();

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SplTransfer {
                    from: ctx.accounts.customer_stable.to_account_info(),
                    to: ctx.accounts.merchant_stable.to_account_info(),
                    authority: ctx.accounts.customer.to_account_info(),
                },
            ),
            net_amount,
        )?;

        if fee_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    SplTransfer {
                        from: ctx.accounts.customer_stable.to_account_info(),
                        to: ctx.accounts.fee_stable.to_account_info(),
                        authority: ctx.accounts.customer.to_account_info(),
                    },
                ),
                fee_amount,
            )?;
        }

        let receipt = &mut ctx.accounts.receipt;
        receipt.customer = ctx.accounts.customer.key();
        receipt.merchant = ctx.accounts.merchant.key();
        receipt.mint = ctx.accounts.stable_mint.key();
        receipt.decimals = ctx.accounts.stable_mint.decimals;
        receipt.amount = amount;
        receipt.fee_amount = fee_amount;
        receipt.net_amount = net_amount;
        receipt.refunded_amount = 0;
        receipt.payment_id = payment_id;
        receipt.timestamp = Clock::get()?.unix_timestamp;
        receipt.bump = ctx.bumps.receipt;

        emit!(PaymentCompleted {
            payment_id,
            customer: ctx.accounts.customer.key(),
            merchant: ctx.accounts.merchant.key(),
            mint: ctx.accounts.stable_mint.key(),
            decimals: ctx.accounts.stable_mint.decimals,
            amount,
            fee_amount,
            net_amount,
            timestamp: receipt.timestamp,
        });

        Ok(())
    }

    pub fn refund_stable(ctx: Context<RefundStable>, refund_amount: u64) -> Result<()> {
        let receipt = &mut ctx.accounts.receipt;
        
        // Ensure merchant is the one refunding
        require!(ctx.accounts.merchant.key() == receipt.merchant, SlikError::UnauthorizedRefund);
        
        // Ensure valid refund amount
        require!(refund_amount > 0, SlikError::ZeroAmount);
        let max_refundable = receipt.net_amount.checked_sub(receipt.refunded_amount).unwrap();
        require!(refund_amount <= max_refundable, SlikError::RefundExceedsAmount);

        // Transfer PUSD back to customer from merchant
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SplTransfer {
                    from: ctx.accounts.merchant_stable.to_account_info(),
                    to: ctx.accounts.customer_stable.to_account_info(),
                    authority: ctx.accounts.merchant.to_account_info(),
                },
            ),
            refund_amount,
        )?;

        // Update receipt
        receipt.refunded_amount = receipt.refunded_amount.checked_add(refund_amount).unwrap();

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, payment_id: [u8; 16])]
pub struct Pay<'info> {
    #[account(mut)]
    pub customer: Signer<'info>,

    /// CHECK: Merchant wallet, validated by the backend when constructing TX
    #[account(mut)]
    pub merchant: UncheckedAccount<'info>,

    /// CHECK: SLIK protocol fee recipient
    #[account(
        mut,
        address = FEE_WALLET @ SlikError::InvalidFeeWallet
    )]
    pub fee_wallet: UncheckedAccount<'info>,

    #[account(
        init,
        payer = customer,
        space = 8 + Receipt::INIT_SPACE,
        seeds = [b"receipt", payment_id.as_ref()],
        bump,
    )]
    pub receipt: Account<'info, Receipt>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, payment_id: [u8; 16])]
pub struct PayStable<'info> {
    #[account(mut)]
    pub customer: Signer<'info>,

    /// CHECK: Merchant wallet, validated by the backend
    #[account(mut)]
    pub merchant: UncheckedAccount<'info>,

    /// CHECK: Protocol fee recipient
    #[account(
        mut,
        address = FEE_WALLET @ SlikError::InvalidFeeWallet
    )]
    pub fee_wallet: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = stable_mint,
        token::authority = customer,
    )]
    pub customer_stable: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stable_mint,
    )]
    pub merchant_stable: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stable_mint,
    )]
    pub fee_stable: Account<'info, TokenAccount>,

    #[account(address = STABLE_MINT @ SlikError::InvalidMint)]
    pub stable_mint: Account<'info, token::Mint>,

    #[account(
        init,
        payer = customer,
        space = 8 + Receipt::INIT_SPACE,
        seeds = [b"receipt", payment_id.as_ref()],
        bump,
    )]
    pub receipt: Account<'info, Receipt>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundStable<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,

    /// CHECK: Customer wallet, read from receipt
    #[account(mut, address = receipt.customer @ SlikError::InvalidCustomer)]
    pub customer: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = stable_mint,
        token::authority = merchant,
    )]
    pub merchant_stable: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stable_mint,
    )]
    pub customer_stable: Account<'info, TokenAccount>,

    #[account(address = STABLE_MINT @ SlikError::InvalidMint)]
    pub stable_mint: Account<'info, token::Mint>,

    #[account(
        mut,
        seeds = [b"receipt", receipt.payment_id.as_ref()],
        bump = receipt.bump,
    )]
    pub receipt: Account<'info, Receipt>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Receipt {
    pub customer: Pubkey,     // 32
    pub merchant: Pubkey,     // 32
    pub mint: Pubkey,         // 32
    pub decimals: u8,         // 1
    pub amount: u64,          // 8
    pub fee_amount: u64,      // 8
    pub net_amount: u64,      // 8
    pub refunded_amount: u64, // 8
    pub payment_id: [u8; 16], // 16
    pub timestamp: i64,       // 8
    pub bump: u8,             // 1
}

#[event]
pub struct PaymentCompleted {
    pub payment_id: [u8; 16],
    pub customer: Pubkey,
    pub merchant: Pubkey,
    pub mint: Pubkey,
    pub decimals: u8,
    pub amount: u64,
    pub fee_amount: u64,
    pub net_amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum SlikError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Invalid fee wallet address")]
    InvalidFeeWallet,
    #[msg("Invalid stablecoin mint address")]
    InvalidMint,
    #[msg("Unauthorized refund attempt")]
    UnauthorizedRefund,
    #[msg("Refund amount exceeds net captured amount")]
    RefundExceedsAmount,
    #[msg("Invalid customer account")]
    InvalidCustomer,
}
