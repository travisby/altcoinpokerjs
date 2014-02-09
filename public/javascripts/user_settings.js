var $deletePayoutButtons = $('.delete-payout-button');

function deleteWallet(walletID) {
    $.ajax(
        {
            method: 'DELETE',
            url: '/payout/' + walletID
        }
    );
}

$deletePayoutButtons.click(
    function (e) {
        var $button = $(this);
        var walletID = $button.parent().data('id');

        deleteWallet(walletID);
    }
);
