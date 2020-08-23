$(document).ready(function () {

    //#region Authorize kontrolü
    var token = sessionStorage.getItem("4p1t0k3n");
    var pageURL = $(location).attr("href");
    var page = getPageName(pageURL);
    if (token === null && page !== "") {
        window.location = '/';
    }
    else if (token !== null && page === "") {
        window.history.back();
    }
    function getPageName() {
        var index = window.location.href.lastIndexOf("/") + 1,
            filenameWithExtension = window.location.href.substr(index),
            filename = filenameWithExtension.split(".")[0];
        return filename;
    }
    //#endregion

    //#region Admin girişi
    $("Form#sign_in").submit(function (e) {
        e.preventDefault();
        if ($(this).valid()) {
            var formData = new FormData(e.target);
            var object = {};
            formData.forEach(function (value, key) {
                object[key] = value;
            });
            var json = JSON.stringify(object);
            $.ajax({
                url: "http://localhost:54722/Users/Authenticate",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: json,
                success: function (response) {
                    if (response.isSuccess) {
                        swal.fire({
                            title: "Başarılı!",
                            text: response.message,
                            type: "success"
                        });
                        sessionStorage.setItem("4p1t0k3n", response.token);
                        setTimeout(function () {
                            window.location = '/Admin';
                        }, 2000);
                    }
                },
                error: function (response) {
                    var result = JSON.parse(response.responseText);
                    swal.fire({
                        title: "Hata!",
                        text: result.message,
                        type: "error"
                    });
                }
            });
        }
    });
    //#endregion

    //#region Kategori Yönetimi
    $('#CategoryTable').dataTable({
        fixedHeader: {
            header: true,
            footer: true
        },
        "destroy": true,
        "ordering": false,
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Hepsi"]],
        "ajax": {
            "url": "http://localhost:54722/api/Categories/GetCategoriesAll",
            "type": "GET",
            "datatype": "json",
            "headers": {
                "authorization": "Bearer " + sessionStorage.getItem("4p1t0k3n")
            },
            data: function (data) {
                return JSON.stringify(data);
            }  
        },
        "columns": [
            {
                "data": "name"
            },
            {
                data: "createdOn",
                render: function (data, type, row) {
                        return "<td>" + data + "</td>";
                    }
                },
                {
                    data: "isActive",
                    render: function (data, type, row) {
                        if (data === true) return "<td><i class='material-icons bg-green'>check</i></td>";
                        if (data === false) return "<td><i class='material-icons bg-red'>close</i></td>";
                    }
                },
                {
                    data: "isActive",
                    render: function (data, type, row) {
                        if (data === true) {
                            return "<td><button type='button' class='btn bg-green waves-effect' id='pasif' data-id='" + data + "' data-target='" + row.id + "'> <i class='material-icons'>thumb_up</i> Aktif </button>" +
                                "<a href = '/Admin/Kategori/Duzenle/" + row.id + "' style = 'margin-left: 1px;' class='btn bg-purple waves-effect'><i class='material-icons'>edit</i> Düzenle </a >" +
                                "<button type='button' id='sil' data-id='" + row.id + "' class='btn bg-red waves-effect'><i class='material-icons'>delete</i>Sil</button><td>";
                        }
                        if (data === false) {
                            return "<td><button type='button' class='btn bg-orange waves-effect' id='aktif' data-id='" + data + "' data-target='" + row.id + "'> <i class='material-icons'>thumb_down</i> Pasif </button>" +
                                "<a href = '/Admin/Kategori/Duzenle/" + row.id + "' style = 'margin-left: 1px;' class='btn bg-purple waves-effect'><i class='material-icons'>edit</i> Düzenle </a >" +
                                "<button type='button' id='sil' data-id='" + row.id + "' class='btn bg-red waves-effect'><i class='material-icons'>delete</i>Sil</button><td>";
                        }
                    }
                }
        ]
            
    });

    $("#CategoryTable").on('click', '#sil', function () {
        var kategori = $(this);
        var id = kategori.data("id");
        swal.fire({
            title: 'Kategori Silinecek!',
            text: "Silmek istediğinize emin misiniz?",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ea3c07',
            confirmButtonText: 'Evet, sil!',
            cancelButtonText: 'İptal!'
        }).then((result) => {
            if (result.value) {
                $.ajax({
                    url: "http://localhost:54722/api/Categories/Delete/" + id,
                    method: 'DELETE',
                    data: { id },
                    headers: {
                        'Authorization': "Bearer " + sessionStorage.getItem("4p1t0k3n")
                    }
                });
                swal.fire('Silindi!', 'Kategori silindi', 'success');
                setTimeout(function () {
                    swal.close();
                    kategori.closest("tr").fadeOut(1000, function () {
                        kategori.closest("tr").remove();
                    });
                }, 1000);
            }
            else {
                swal.fire('İptale Basıldı!', 'Kategori silinemedi', 'error');
            }
        });
    });

    $("#CategoryTable").on("click", "#pasif, #aktif", function () {
        var id = $(this).data("target");
        var IsActive = $(this).data("id");
        var parent = $(this).next();
        $(this).remove();
        $.ajax({
            url: "http://localhost:54722/api/Categories/ActiveControl/" + id,
            type: 'POST',
            data: { id },
            headers: {
                'Authorization': "Bearer " + sessionStorage.getItem("4p1t0k3n")
            },
            success: function (data) {
                if (IsActive) {
                    parent.before("<button type='button' class='btn bg-orange waves-effect' id='pasif' data-id='false' data-target=" + id + "> " + " <i class='material-icons'>thumb_down</i> Pasif " + " </button>");
                    swal.fire({
                        title: 'Kategori Pasif Oldu !',
                        type: 'error'
                    });
                    parent.closest('td').prev('td').remove();
                    parent.closest('td').prev('td').after('<td><i class="material-icons bg-red">close</i></td>');
                }
                else {
                    parent.before("<button type='button' class='btn bg-green waves-effect' id='aktif' data-id='true' data-target=" + id + "> " + "<i class='material-icons'>thumb_up</i> Aktif " + " </button >");
                    swal.fire({
                        title: 'Kategori Aktif Oldu !',
                        type: 'success'
                    });
                    parent.closest('td').prev('td').remove();
                    parent.closest('td').prev('td').after('<td><i class="material-icons bg-green">check</i></td>');
                }

            },
            error: function (data) {
                swal.fire({
                    title: 'İşlem Gerçekleşmedi !',
                    type: 'warning'
                });
            }
        });
    });

    $.ajax({
        url: "http://localhost:54722/api/Categories/Count",
        type: "POST",
        headers: {
            'Authorization': "Bearer " + sessionStorage.getItem("4p1t0k3n")
        },
        success: function (response) {
            $("#CategoryCount").data("to", response.Toplam);
            $("#CategoryActiveCount").data("to", response.Aktif);
            $("#CategoryPasiveCount").data("to", response.Pasif);
        },
        error: function (response) {
            var result = JSON.parse(response.responseText);
            swal.fire({
                title: "Hata!",
                text: result.message,
                type: "error"
            });
        }
    });

    //#endregion
});

//#region Güvenli Çıkış
function Exit() {
    sessionStorage.removeItem("4p1t0k3n");
    window.location = "/";
}
//#endregion