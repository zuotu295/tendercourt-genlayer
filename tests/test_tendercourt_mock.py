"""TenderCourt mock tests — pure-Python unit tests for contracts/tendercourt.py.

A fresh mock harness written for this contract: it stubs the `genlayer`
module (message context, exec_prompt answers, consensus check, transfers)
and drives the contract methods directly. No chain, no network.
Run: python3 -m pytest tests/test_tendercourt_mock.py -q
"""
import json
import sys
import types
import unittest

# ---------------------------------------------------------------------------
# Minimal `genlayer` stub (written for this contract only)
# ---------------------------------------------------------------------------
genlayer = types.ModuleType('genlayer')
genlayer.__all__ = ['gl', 'TreeMap', 'u32', 'u256', 'Address']


class _UserError(Exception):
    pass


class _Return:
    def __init__(self, calldata):
        self.calldata = calldata


class _ConsensusDisagreement(Exception):
    pass


class _Message:
    sender_address = ''
    value = 0


class _VM:
    UserError = _UserError
    Return = _Return

    @staticmethod
    def run_nondet_unsafe(leader_fn, validator_fn):
        # Leader runs; if it raises, the transaction fails (no state change).
        try:
            leader = leader_fn()
        except Exception:
            raise
        # Validators re-run the judgment and must agree exactly.
        if not validator_fn(_Return(leader)):
            raise _ConsensusDisagreement('MAJORITY_DISAGREE')
        return leader


class _Nondet:
    # Canned exec_prompt answers, consumed in order (leader, then validator).
    answers = []

    @staticmethod
    def exec_prompt(prompt, response_format='json'):
        if not _Nondet.answers:
            raise AssertionError('exec_prompt called with no canned answer')
        return _Nondet.answers.pop(0)


def _identity(fn):
    return fn


_identity.payable = _identity


class _Public:
    # staticmethod: accessed via an instance, a plain function would bind
    # `self` and break decorator use (@gl.public.write takes exactly fn).
    write = staticmethod(_identity)
    view = staticmethod(_identity)


class _EVM:
    @staticmethod
    def contract_interface(cls):
        transfers = []

        def __init__(self, address=None):
            self.address = address

        def emit_transfer(self, value=None, **kw):
            transfers.append((self.address, value))

        cls.__init__ = __init__
        cls.emit_transfer = emit_transfer
        cls.transfers = transfers
        return cls


class _Contract:
    @property
    def balance(self):
        return int(self.total_received - self.total_withdrawn)


class _GL:
    vm = _VM
    nondet = _Nondet
    message = _Message()
    public = _Public()
    evm = _EVM()
    Contract = _Contract


genlayer.gl = _GL
genlayer.TreeMap = dict
genlayer.u32 = int
genlayer.u256 = int
genlayer.Address = str
sys.modules['genlayer'] = genlayer

sys.path.insert(0, 'contracts')
import tendercourt as TC  # noqa: E402

FEE = TC.FEE_WEI
BUYER = '0x' + '11' * 20
SUP1 = '0x' + '22' * 20
SUP2 = '0x' + '33' * 20
SUP3 = '0x' + '44' * 20
OUT = '0x' + '55' * 20

REQ = 'Build a bilingual landing page for our bakery, with online ordering and a menu in English and Chinese, delivered within two weeks.'
CAT = 'Software Development'
BUDGET = 500


def judge_answer(winner, reason='Quote meets all requirements with the lowest price and complete terms.'):
    return json.dumps({'winner_quote_id': winner, 'reason': reason})


class TenderCourtTest(unittest.TestCase):
    def setUp(self):
        self.c = TC.TenderCourt()
        self.c.__init__()
        _Nondet.answers = []

    def as_sender(self, addr, value=0):
        _GL.message.sender_address = addr
        _GL.message.value = value

    def create(self, buyer=BUYER, budget=BUDGET):
        self.as_sender(buyer, FEE)
        return json.loads(self.c.create_tender(REQ, CAT, budget))

    def quote(self, tender_id, supplier, price, terms='Delivery in two weeks, includes design, build, and one revision round.'):
        self.as_sender(supplier)
        return json.loads(self.c.submit_quote(tender_id, price, terms))

    def expect_error(self, code, fn, *args, **kwargs):
        with self.assertRaises(_UserError) as ctx:
            fn(*args, **kwargs)
        self.assertEqual(str(ctx.exception), code)

    # -- create ------------------------------------------------------------
    def test_create_happy(self):
        t = self.create()
        self.assertEqual(t['status'], 'OPEN')
        self.assertEqual(t['buyer'], BUYER)
        self.assertEqual(t['budget_gen'], BUDGET)
        self.assertEqual(t['quotes'], [])
        totals = json.loads(self.c.get_totals())
        self.assertEqual(totals['total_received_wei'], FEE)
        self.assertEqual(totals['tender_count'], 1)

    def test_create_wrong_fee(self):
        self.as_sender(BUYER, 0)
        self.expect_error('FEE_MUST_BE_10_GEN', self.c.create_tender, REQ, CAT, BUDGET)

    def test_create_requirements_bounds(self):
        self.as_sender(BUYER, FEE)
        self.expect_error('REQUIREMENTS', self.c.create_tender, 'too short', CAT, BUDGET)
        self.expect_error('REQUIREMENTS', self.c.create_tender, 'x' * 2001, CAT, BUDGET)

    def test_create_bad_category(self):
        self.as_sender(BUYER, FEE)
        self.expect_error('CATEGORY', self.c.create_tender, REQ, 'Not A Category', BUDGET)

    def test_create_budget_bounds(self):
        self.as_sender(BUYER, FEE)
        self.expect_error('BUDGET', self.c.create_tender, REQ, CAT, 0)
        self.expect_error('BUDGET', self.c.create_tender, REQ, CAT, 10001)

    # -- quotes ------------------------------------------------------------
    def test_quote_happy(self):
        t = self.create()
        q = self.quote(t['tender_id'], SUP1, 400)
        self.assertEqual(len(q['quotes']), 1)
        self.assertEqual(q['quotes'][0]['quote_id'], 1)
        self.assertEqual(q['quotes'][0]['supplier'], SUP1)
        self.assertEqual(q['quotes'][0]['price_gen'], 400)

    def test_buyer_cannot_quote_own(self):
        t = self.create()
        self.expect_error('BUYER_CANNOT_QUOTE_OWN_TENDER', self.quote, t['tender_id'], BUYER, 400)

    def test_duplicate_quote(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.expect_error('DUPLICATE_QUOTE', self.quote, t['tender_id'], SUP1, 350)

    def test_quote_price_bounds(self):
        t = self.create()
        self.expect_error('QUOTE_PRICE', self.quote, t['tender_id'], SUP1, 0)
        self.expect_error('QUOTE_PRICE', self.quote, t['tender_id'], SUP1, BUDGET + 1)

    def test_quote_terms_bounds(self):
        t = self.create()
        self.expect_error('QUOTE_TERMS', self.quote, t['tender_id'], SUP1, 400, 'short')

    # -- cancel ------------------------------------------------------------
    def test_cancel_no_quotes_refunds(self):
        t = self.create()
        self.as_sender(BUYER)
        done = json.loads(self.c.cancel_tender(t['tender_id']))
        self.assertEqual(done['status'], 'CANCELLED')
        self.assertEqual(done['buyer_credit'], FEE)
        self.as_sender(BUYER)
        w = json.loads(self.c.withdraw(t['tender_id']))
        self.assertEqual(w['role'], 'buyer')
        self.assertEqual(w['withdrawn_wei'], FEE)

    def test_cancel_with_quotes_forbidden(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.expect_error('CANNOT_CANCEL_WITH_QUOTES', self.c.cancel_tender, t['tender_id'])

    def test_cancel_by_outsider(self):
        t = self.create()
        self.as_sender(OUT)
        self.expect_error('ONLY_BUYER_CAN_CANCEL', self.c.cancel_tender, t['tender_id'])

    # -- direct award ------------------------------------------------------
    def test_award_direct_and_withdraw(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.quote(t['tender_id'], SUP2, 450)
        self.as_sender(BUYER)
        done = json.loads(self.c.award_tender(t['tender_id'], 2))
        self.assertEqual(done['status'], 'AWARDED')
        self.assertEqual(done['winner_quote_id'], 2)
        self.assertEqual(done['winner_supplier'], SUP2)
        self.assertEqual(done['winner_credit'], FEE)
        self.as_sender(SUP2)
        w = json.loads(self.c.withdraw(t['tender_id']))
        self.assertEqual(w['role'], 'winner')
        self.assertEqual(w['withdrawn_wei'], FEE)
        self.expect_error('NO_CREDIT', self.c.withdraw, t['tender_id'])

    def test_award_unknown_quote(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.expect_error('QUOTE_NOT_FOUND', self.c.award_tender, t['tender_id'], 99)

    def test_award_by_outsider(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(OUT)
        self.expect_error('ONLY_BUYER_CAN_AWARD', self.c.award_tender, t['tender_id'], 1)

    # -- judgment ----------------------------------------------------------
    def test_request_judgment_no_quotes(self):
        t = self.create()
        self.as_sender(BUYER)
        self.expect_error('NO_QUOTES', self.c.request_judgment, t['tender_id'])

    def test_judge_picks_winner(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.quote(t['tender_id'], SUP2, 450)
        self.as_sender(BUYER)
        mid = json.loads(self.c.request_judgment(t['tender_id']))
        self.assertEqual(mid['status'], 'JUDGING')
        _Nondet.answers = [judge_answer(1), judge_answer(1)]
        done = json.loads(self.c.judge(t['tender_id']))
        self.assertEqual(done['status'], 'AWARDED')
        self.assertEqual(done['winner_quote_id'], 1)
        self.assertEqual(done['winner_supplier'], SUP1)
        self.as_sender(SUP1)
        w = json.loads(self.c.withdraw(t['tender_id']))
        self.assertEqual(w['withdrawn_wei'], FEE)

    def test_judge_no_award_refunds_buyer(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.c.request_judgment(t['tender_id'])
        _Nondet.answers = [judge_answer(0, 'No quote satisfies the requirements: all miss required deliverables.'),
                           judge_answer(0, 'No quote satisfies the requirements: all miss required deliverables.')]
        done = json.loads(self.c.judge(t['tender_id']))
        self.assertEqual(done['status'], 'CANCELLED')
        self.assertEqual(done['winner_quote_id'], 0)
        self.assertEqual(done['buyer_credit'], FEE)
        self.as_sender(BUYER)
        w = json.loads(self.c.withdraw(t['tender_id']))
        self.assertEqual(w['role'], 'buyer')

    def test_judge_disagreement_fails_and_stays_judging(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.quote(t['tender_id'], SUP2, 450)
        self.as_sender(BUYER)
        self.c.request_judgment(t['tender_id'])
        _Nondet.answers = [judge_answer(1), judge_answer(2)]
        with self.assertRaises(_ConsensusDisagreement):
            self.c.judge(t['tender_id'])
        cur = json.loads(self.c.get_tender(t['tender_id']))
        self.assertEqual(cur['status'], 'JUDGING')

    def test_judge_by_outsider(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.c.request_judgment(t['tender_id'])
        self.as_sender(OUT)
        self.expect_error('ONLY_BUYER_CAN_JUDGE', self.c.judge, t['tender_id'])

    def test_judge_while_open(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.expect_error('TENDER_NOT_JUDGING', self.c.judge, t['tender_id'])

    def test_judge_bad_winner_id_fails(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.c.request_judgment(t['tender_id'])
        _Nondet.answers = [judge_answer(99), judge_answer(99)]
        with self.assertRaises(_UserError):
            self.c.judge(t['tender_id'])

    def test_quote_after_judging_blocked(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.c.request_judgment(t['tender_id'])
        self.expect_error('TENDER_NOT_OPEN', self.quote, t['tender_id'], SUP2, 450)

    # -- accounting --------------------------------------------------------
    def test_ledger_conserved(self):
        t1 = self.create()
        self.quote(t1['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.c.award_tender(t1['tender_id'], 1)
        self.as_sender(SUP1)
        self.c.withdraw(t1['tender_id'])
        t2 = self.create()
        self.as_sender(BUYER)
        self.c.cancel_tender(t2['tender_id'])
        self.c.withdraw(t2['tender_id'])
        totals = json.loads(self.c.get_totals())
        self.assertEqual(totals['total_received_wei'], 2 * FEE)
        self.assertEqual(totals['total_withdrawn_wei'], 2 * FEE)
        self.assertEqual(totals['contract_balance_wei'], 0)
        self.assertEqual(totals['escrowed_wei'], 0)


if __name__ == '__main__':
    unittest.main()
