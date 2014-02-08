$('#delete_wallet').submit(
    function (e) {
        e.preventDefault();
        deleteWallet($('#delete_wallet').find('input[name="walletID"').val());
    }
);

function deleteWallet(walletID) {
    $.ajax(
        {
            method: 'DELETE',
            url: '/payout/' + walletID
        }
    );
}
