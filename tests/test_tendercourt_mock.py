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
SUP4 = '0x' + '66' * 20
SUP5 = '0x' + '77' * 20
SUP6 = '0x' + '88' * 20
SUP7 = '0x' + '99' * 20
SUP8 = '0x' + 'aa' * 20
SUP9 = '0x' + 'bb' * 20
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
        TC._Recipient.transfers.clear()

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

    def test_quote_limit(self):
        t = self.create()
        for i, s in enumerate([SUP1, SUP2, SUP3, SUP4, SUP5, SUP6, SUP7, SUP8]):
            self.quote(t['tender_id'], s, 400 - i * 10)
        self.assertEqual(len(json.loads(self.c.get_tender(t['tender_id']))['quotes']), 8)
        self.expect_error('QUOTE_LIMIT', self.quote, t['tender_id'], SUP9, 300)

    def test_capacity_reserves_every_slot(self):
        t = self.create()
        suppliers = [SUP1, SUP2, SUP3, SUP4, SUP5, SUP6, SUP7, SUP8]
        for i, supplier in enumerate(suppliers):
            self.quote(t['tender_id'], supplier, 400, '界' * 1000)
        full = json.loads(self.c.get_tender(1))
        self.assertEqual(sum(len(q['terms']) for q in full['quotes']), 8000)
        self.as_sender(OUT)
        self.expect_error('ONLY_BUYER_OR_QUOTER_CAN_REQUEST_JUDGMENT', self.c.request_judgment, 1)
        self.expect_error('QUOTE_LIMIT', self.quote, 1, SUP9, 400)
        self.as_sender(SUP1)
        self.c.request_judgment(1)
        self.expect_error('TENDER_NOT_OPEN', self.quote, 1, SUP9, 400)
        self.as_sender(OUT)
        _Nondet.answers = [judge_answer(1), judge_answer(1)]
        self.c.judge(1)
        self.expect_error('TENDER_NOT_OPEN', self.c.request_judgment, 1)
        self.expect_error('NO_CREDIT', self.c.withdraw, 1)
        self.as_sender(SUP1)
        self.c.withdraw(1)
        self.expect_error('NO_CREDIT', self.c.withdraw, 1)
        self.assertEqual(json.loads(self.c.get_totals())['total_withdrawn_wei'], FEE)

    def test_oversized_quote_does_not_consume_capacity(self):
        self.create()
        for n in [1001, 2000]:
            before = self.c.get_tender(1)
            self.expect_error('QUOTE_TERMS', self.quote, 1, SUP1, 400, 'x' * n)
            self.assertEqual(self.c.get_tender(1), before)
        self.quote(1, SUP1, 400, 'x' * 10)
        self.quote(1, SUP2, 400, ' ' + 'x' * 1000 + ' ')
        self.assertEqual(len(json.loads(self.c.get_tender(1))['quotes'][1]['terms']), 1000)
        self.assertEqual(TC.MAX_QUOTE_TERMS_CHARS * TC.MAX_QUOTES_PER_TENDER, TC.MAX_TOTAL_TERMS_CHARS)

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

    def test_judge_by_anyone_in_judging(self):
        # v2: once JUDGING, anyone may execute the consensus judgment.
        # The winner is decided by consensus, so the caller cannot bias it.
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(BUYER)
        self.c.request_judgment(t['tender_id'])
        _Nondet.answers = [judge_answer(1), judge_answer(1)]
        self.as_sender(OUT)
        done = json.loads(self.c.judge(t['tender_id']))
        self.assertEqual(done['status'], 'AWARDED')
        self.assertEqual(done['winner_quote_id'], 1)

    def test_request_judgment_by_quoter_when_full(self):
        # v2: a quoter may request judgment once the tender is full
        # (no more quotes can arrive, so nobody is cut off).
        t = self.create()
        for i, s in enumerate([SUP1, SUP2, SUP3, SUP4, SUP5, SUP6, SUP7, SUP8]):
            self.quote(t['tender_id'], s, 400 - i * 10)
        self.as_sender(SUP1)
        mid = json.loads(self.c.request_judgment(t['tender_id']))
        self.assertEqual(mid['status'], 'JUDGING')

    def test_request_judgment_by_quoter_when_not_full(self):
        t = self.create()
        self.quote(t['tender_id'], SUP1, 400)
        self.as_sender(SUP1)
        self.assertEqual(json.loads(self.c.request_judgment(t['tender_id']))['status'], 'JUDGING')

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

    # -- partial-fill recovery (supplier alternative to a timeout) ---------
    def partial(self, count):
        self.create()
        suppliers = [SUP1, SUP2, SUP3, SUP4, SUP5, SUP6, SUP7]
        for supplier in suppliers[:count]:
            self.quote(1, supplier, 400)
        return suppliers[:count]

    def test_partial_fill_silent_buyer_winner_and_withdraw_all_sizes(self):
        for count in range(1, 8):
            with self.subTest(quotes=count):
                self.setUp()
                suppliers = self.partial(count)
                # Last supplier requests; consensus may choose someone else.
                self.as_sender(suppliers[-1])
                before = json.loads(self.c.get_tender(1))['quotes']
                mid = json.loads(self.c.request_judgment(1))
                self.assertEqual(mid['status'], 'JUDGING')
                self.assertEqual(mid['quotes'], before)
                self.assertEqual(mid['winner_credit'] + mid['buyer_credit'], 0)
                self.expect_error('NO_CREDIT', self.c.withdraw, 1)
                self.as_sender(OUT)
                _Nondet.answers = [judge_answer(1), judge_answer(1)]
                settled = json.loads(self.c.judge(1))
                self.assertEqual(settled['winner_supplier'], SUP1)
                self.assertEqual(settled['winner_credit'], FEE)
                self.assertEqual(settled['buyer_credit'], 0)
                self.assertEqual(settled['quotes'], before)
                for denied in [BUYER, OUT] + suppliers[1:]:
                    self.as_sender(denied)
                    self.expect_error('NO_CREDIT', self.c.withdraw, 1)
                self.as_sender(SUP1)
                self.c.withdraw(1)
                self.expect_error('NO_CREDIT', self.c.withdraw, 1)
                self.expect_error('TENDER_NOT_JUDGING', self.c.judge, 1)
                self.expect_error('TENDER_NOT_OPEN', self.c.request_judgment, 1)
                self.assertEqual(TC._Recipient.transfers, [(SUP1, FEE)])
                totals = json.loads(self.c.get_totals())
                self.assertEqual(totals['total_received_wei'], FEE)
                self.assertEqual(totals['total_withdrawn_wei'], FEE)
                self.assertEqual(totals['escrowed_wei'], 0)

    def test_partial_fill_no_award_refund_all_sizes(self):
        for count in range(1, 8):
            with self.subTest(quotes=count):
                self.setUp()
                suppliers = self.partial(count)
                self.as_sender(suppliers[-1])
                self.c.request_judgment(1)
                self.as_sender(OUT)
                _Nondet.answers = [judge_answer(0), judge_answer(0)]
                result = json.loads(self.c.judge(1))
                self.assertEqual(result['status'], 'CANCELLED')
                self.assertEqual(result['winner_credit'], 0)
                self.assertEqual(result['buyer_credit'], FEE)
                for denied in suppliers + [OUT]:
                    self.as_sender(denied)
                    self.expect_error('NO_CREDIT', self.c.withdraw, 1)
                self.as_sender(BUYER)
                self.c.withdraw(1)
                self.expect_error('NO_CREDIT', self.c.withdraw, 1)
                self.expect_error('TENDER_NOT_OPEN', self.c.award_tender, 1, 1)
                self.assertEqual(TC._Recipient.transfers, [(BUYER, FEE)])
                self.assertEqual(json.loads(self.c.get_totals())['escrowed_wei'], 0)

    def test_partial_fill_outsider_cannot_close_window_all_sizes(self):
        for count in range(1, 8):
            with self.subTest(quotes=count):
                self.setUp()
                self.partial(count)
                self.as_sender(OUT)
                before = self.c.get_tender(1)
                self.expect_error('ONLY_BUYER_OR_QUOTER_CAN_REQUEST_JUDGMENT',
                                  self.c.request_judgment, 1)
                self.assertEqual(self.c.get_tender(1), before)
                self.expect_error('TENDER_NOT_JUDGING', self.c.judge, 1)

    def test_supplier_recovery_freezes_quotes_and_buyer_override(self):
        self.partial(2)
        self.as_sender(SUP1)
        self.c.request_judgment(1)
        before = self.c.get_tender(1)
        self.expect_error('TENDER_NOT_OPEN', self.quote, 1, SUP3, 300)
        self.as_sender(BUYER)
        self.expect_error('TENDER_NOT_OPEN', self.c.award_tender, 1, 2)
        self.expect_error('TENDER_NOT_OPEN', self.c.cancel_tender, 1)
        self.expect_error('TENDER_NOT_OPEN', self.c.request_judgment, 1)
        self.assertEqual(self.c.get_tender(1), before)

    def test_supplier_recovery_disagreement_invalid_result_retry(self):
        self.partial(2)
        self.as_sender(SUP2)
        self.c.request_judgment(1)
        before = self.c.get_tender(1)
        self.as_sender(OUT)
        _Nondet.answers = [judge_answer(2), judge_answer(1)]
        with self.assertRaises(_ConsensusDisagreement):
            self.c.judge(1)
        self.assertEqual(self.c.get_tender(1), before)
        for winner in [99, True, '1']:
            _Nondet.answers = [judge_answer(winner)]
            self.expect_error('JUDGE_WINNER', self.c.judge, 1)
            self.assertEqual(self.c.get_tender(1), before)
        _Nondet.answers = [judge_answer(1), judge_answer(1)]
        self.assertEqual(json.loads(self.c.judge(1))['winner_quote_id'], 1)
        self.assertEqual(TC._Recipient.transfers, [])

    def test_empty_tender_supplier_cannot_request_or_withdraw(self):
        self.create()
        self.as_sender(SUP1)
        before = self.c.get_tender(1)
        self.expect_error('NO_QUOTES', self.c.request_judgment, 1)
        self.expect_error('NO_CREDIT', self.c.withdraw, 1)
        self.assertEqual(self.c.get_tender(1), before)
        self.assertEqual(self.c.get_protocol(), 'tendercourt-2.2')

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
