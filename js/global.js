const BASEURL = 'http://localhost:62465/';
let TOKEN = '';

//#region Authorize kontrolü
TOKEN = sessionStorage.getItem("4p1t0k3n"); // Token'i session'a atama
let pageURL = $(location).attr("href");
let page = getPageName(pageURL);
if (TOKEN === null && page !== 'login') {
    window.location = 'login.html';
}
else if (TOKEN !== null  && page === "login") {
    window.history.back();
}
else if(TOKEN !== null && page === "index"){
    index();
}
else if(TOKEN !== null && page === "kategoriler"){
    trendingStatistics("Categories","KATEGORİ");
    categoryManagement();
}
else if(TOKEN !== null && page === "sorular"){
    trendingStatistics("Questions","SORU");
    questionManagement();
}
// Url parçalama işlemi.
function getPageName() {
    let index = window.location.href.lastIndexOf("/") + 1,
        filenameWithExtension = window.location.href.substr(index),
        filename = filenameWithExtension.split(".")[0];
    return filename;
}
// Api'ye gönderilecek header bilgileri.
const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer '+TOKEN
}
//#endregion

//#region Tarih Formatlama
const dateFormat = function (str) {
	if (str != null) {
		return moment(str).locale('tr').format("DD MMM YYYY");
	}
	return "";
};

const filters = {
	dateFormat
};

//register the filters in Vue
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]));
//#endregion

//#region Güvenli Çıkış
function exit() {
    sessionStorage.removeItem("4p1t0k3n"); // session sonlandırma
    window.location = "login.html";
}
//#endregion

//#region Login
const signIn = new Vue({
    el:'#sign_in',
    data:{
      UserName:"",
      Password:""
    },
    methods:{
        checkForm:function(e) {
            if ($("#sign_in").valid()) {
                axios.post(BASEURL+'Users/Authenticate',{
                    userName: this.UserName,
                    password: this.Password
                })
                .then(function (response) {
                    if(response.data.isSuccess){
                        Swal.fire('Başarılı!', response.data.message, 'success');
                        TOKEN = response.data.token;
                        sessionStorage.setItem("4p1t0k3n", TOKEN); // Api'den dönen JWT token değerini session'a atama.
                        setTimeout(function () {
                            window.location = 'index.html';
                         }, 2000);
                    }
                    else{
                        Swal.fire('Hata!', response.data.message, 'error');
                    }
                })
                .catch(function (error) {
                    if(error.response===undefined){
                        Swal.fire('Hata!', 'Api kaynağı çalışmıyor.', 'error'); // Api uygulaması ayakta değilse.
                    }
                    else{
                        Swal.fire('Hata!', error.response.data.message, 'error');
                    }
                });
                e.preventDefault();
            }
      }
    }
  });
//#endregion

//#region Genel İstatistikler

function index(){
    const global_count = new Vue({
        el: "#global_count",
        data() { return {   
                 categoriesCount: "",
                 questionsCount: "",
                 usersCount: "",
                 scoresCount: "",
                 isLoad: true
        }
        },
        mounted(){
               axios.get(BASEURL+'api/globals/count', {
                    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer '+TOKEN}
                })
                .then(response => {
                    this.categoriesCount = response.data.categoriesCount;
                    this.questionsCount = response.data.questionsCount;
                    this.usersCount = response.data.usersCount;
                    this.scoresCount = response.data.scoresCount;
                    this.isLoad = false;
                });
         }
     });
}

//#endregion

//#region İstatistikler

function trendingStatistics(endpoint,title){
    // İstatistikler kısmını component olarak oluşturup kategori ve sorular sayfasında kullanıyoruz.
    const trendingStatistics = new Vue({
        el: '#trendingStatistics',
        data: {
            activeCount: null,
            passiveCount: null,
            totalCount: null,
            title: title,
            isLoad: true
        },
        components: {
            'trending':{
                        props: {
            title: {type: String, required: true},
            activecount: {type: Number, required: true},
            passivecount: {type: Number, required: true},
            totalcount: {type: Number, required: true},
            isload: {type: Boolean, required: true}
        },
                template: `
                <div id="trendingWrapper">
                <img v-if="isload" src="images/loading.gif" width="300px" style="margin-left: 200px">
                <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" v-if="!isload">
                    <div class="info-box bg-purple hover-expand-effect">
                        <div class="icon">
                            <i class="material-icons">trending_up</i>
                        </div>
                        <div class="content">
                            <div class="text">TOPLAM {{title}} SAYISI</div>
                            <div class="number count-to" data-from="0" v-bind:data-to="totalcount" data-speed="1000" data-fresh-interval="20">{{totalcount}}</div>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" v-if="!isload">
                    <div class="info-box bg-green hover-expand-effect">
                        <div class="icon">
                            <i class="material-icons">thumb_up</i>
                        </div>
                        <div class="content">
                            <div class="text">AKTİF {{title}} SAYISI</div>
                            <div class="number count-to" data-from="0" v-bind:data-to="activecount" data-speed="1000" data-fresh-interval="20">{{activecount}}</div>
                        </div>
                    </div>
                </div>
            
                <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" v-if="!isload">
                    <div class="info-box bg-orange hover-expand-effect">
                        <div class="icon">
                            <i class="material-icons">thumb_down</i>
                        </div>
                        <div class="content">
                            <div class="text">PASİF {{title}} SAYISI</div>
                            <div class="number count-to" data-from="0" v-bind:data-to="passivecount" data-speed="1000" data-fresh-interval="20">{{passivecount}}</div>
                        </div>
                    </div>
                </div>
            </div>`
            } 
        },
        methods: {
            getTrendingStatistics(){
                axios.get(BASEURL+'api/'+endpoint+'/count', {
                    headers: {'Content-Type': 'application/json','Authorization': 'Bearer '+TOKEN} 
                })
                .then(response => {
                    this.activeCount = response.data.activeCount;
                    this.passiveCount = response.data.passiveCount;
                    this.totalCount = response.data.totalCount;
                    this.isLoad = false;
                });
            },
        },
            mounted(){
            this.getTrendingStatistics();
        }, 
      });
}

//#endregion

//#region Kategori Yönetimi

function categoryManagement(){

    //#region Kategori Verileri

    const categoryManagements = new Vue({
        el: "#categoryManagements",
        data: {
            categories: [],
            category: [],
            eventControl: false,
            dataTable: $('#datatable').DataTable()
        },
        methods:{
            getCategories(){
                axios.get(BASEURL+'api/categories',{
                headers: {'Content-Type': 'application/json','Authorization': 'Bearer '+TOKEN}
                })
                .then(response => {
                    this.categories = response.data;
                });
            },
            control(){
                // ekeleme ve güncelleme işlemi için bir control methodu yazdık.
                this.eventControl = false;
            },
            create: function(event){
                const formData = new FormData(this.$refs['createCategory']);
                const data = {};
                for (let [key, val] of formData.entries()) {
                    Object.assign(data, { [key]: val })
                }
                axios.post(BASEURL+'api/categories', data, {
                    headers: headers
                  })
                  .then((response) => {
                    if(response.data!==null){
                        Toast.fire({
                            icon: 'success',
                            title: 'Kategori eklendi!'
                        });
                        event.target.reset();
                        this.getCategories();
                    }
                    else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                    }
                  })
                  .catch((error) => {
                      if(error.response!=undefined){
                        Toast.fire({
                            icon: 'error',
                            title: error.response.data.errors
                          });
                      }
                      else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                      }
                  })
            },
            edit: function(index){
                this.eventControl = true;
                if(this.eventControl){
                    this.category = this.categories[index];
                }
            },
            update: function(){
                const formData = new FormData(this.$refs['updateCategory']);
                const data = {};
                for (let [key, val] of formData.entries()) {
                    Object.assign(data, { [key]: val })
                }
                if(data.IsActive === "true"){
                    data.IsActive = true;
                }
                if(data.IsActive === "false"){
                    data.IsActive = false;
                }
                axios.put(BASEURL+'api/categories', data, {
                    headers: headers
                  })
                  .then((response) => {
                    if(response.data!==null){
                        Toast.fire({
                            icon: 'success',
                            title: 'Kategori Güncellendi!'
                        });
                        this.getCategories();
                    }
                    else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                    }
                  })
                  .catch((error) => {
                      if(error.response!=undefined){
                        Toast.fire({
                            icon: 'error',
                            title: error.response.data.errors
                          });
                      }
                      else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                      }
                  })
            },
            remove: function(category, id){
                Swal.fire({
                    title: "Silmek istiyor musun?",
                    text: "Kategoriyi silmek istediğinize emin misiniz?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: "Evet, sil!",
                    cancelButtonText: "İptal!",
                    closeOnConfirm: true
                  }).then((result) => {
                      if(result.value){
                        this.categories.splice(this.categories.indexOf(category),1);
                        axios.delete(BASEURL+'api/categories/'+id, {
                            headers: headers
                          })
                          .then(response => {
                            if(response.status === 204){
                                Toast.fire({
                                    icon: 'success',
                                    title: 'Kategori silindi!'
                                })
                            }
                            else{
                                Toast.fire({
                                    icon: 'error',
                                    title: 'Kategori silinemedi!'
                                })
                            }
                        })
                        .catch(error => {
                            if(error.response !== undefined){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors
                                });
                            }
                            else{
                                Toast.fire({
                                    icon: 'error',
                                    title: 'Bir hata oluştu!'
                                });
                            }
                        })                      
                      }
                  });
            },
            isActive: function(index){
                this.category = this.categories[index];
                axios.put(BASEURL+'api/Categories/IsActive', this.category, {
                    headers: headers
                  })
                  .then((response) => {
                    if(response.data!==null){
                        if(response.data.isActive){
                            Toast.fire({
                                icon: 'success',
                                title: 'Kategori aktif oldu!'
                            }); 
                        }
                        else{
                            Toast.fire({
                                icon: 'success',
                                title: 'Kategori pasif oldu!'
                            });
                        }
                        this.getCategories();
                        trendingStatistics("Categories","KATEGORİ");
                        console.log("burada");
                    }
                    else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                    }
                  })
                  .catch((error) => {
                      if(error.response!==undefined){
                        Toast.fire({
                            icon: 'error',
                            title: error.response.data.errors
                          });
                      }
                      else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                      }
                  })
            }
        },
        mounted(){
            this.getCategories();
         } 
     });
     //#endregion
     
    }

//#endregion

//#region Soru Yönetimi

function questionManagement(){

    //#region Soru verileri

    const questionManagements = new Vue({
        el: "#questionManagements",
        data: {
            categories: [],
            questions: [],
            question: [],
            eventControl: false,
            dataTable: $('#datatable').DataTable()
        },
        methods: {
            getQuestions(){
                axios.get(BASEURL+'api/questions',{
                headers: {'Content-Type': 'application/json','Authorization': 'Bearer '+TOKEN}
                })
                .then(response => {
                    this.questions = response.data;
                });
            },
            getCategories(){
                axios.get(BASEURL+'api/categories', {
                    headers: {'Content-Type': 'application/json','Authorization': 'Bearer '+TOKEN}
                })
                .then(response => {
                    this.categories = response.data;
                });
            },
            control(){
                // Ekleme ve güncelleme işlemi için bir control methodu yazdık.
                this.eventControl = false;
            },
            create(event){
                const formData = new FormData(this.$refs['createQuestions']);
                const data = {};
                for (let [key, val] of formData.entries()) {
                    Object.assign(data, { [key]: val })
                }
                axios.post(BASEURL+'api/Questions', data, {
                    headers: headers
                  })
                  .then((response) => {
                    if(response.data!==null){
                        Toast.fire({
                            icon: 'success',
                            title: 'Soru eklendi!'
                        });
                        event.target.reset();
                        this.getQuestions();
                    }
                    else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                    }
                  })
                  .catch((error) => {
                      if(error.response!=undefined){
                            if(error.response.data.errors[0]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[0]
                                });
                            }
                            else if(error.response.data.errors[1]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[1]
                                });
                            }
                            else if(error.response.data.errors[2]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[2]
                                });
                            }
                            else if(error.response.data.errors[3]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[3]
                                });
                            }
                            else if(error.response.data.errors[4]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[4]
                                });
                            }
                            else{
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[5]
                                });
                            }
                      }
                      else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                      }
                  })
            },
            edit: function(index){
                this.eventControl = true;
                if(this.eventControl){
                    this.question = this.questions[index];
                }
            },
            update: function(event){
                const formData = new FormData(this.$refs['updateQuestions']);
                const data = {};
                for (let [key, val] of formData.entries()) {
                    Object.assign(data, { [key]: val })
                }
                if(data.IsActive === "true"){
                    data.IsActive = true;
                }
                if(data.IsActive === "false"){
                    data.IsActive = false;
                }
                axios.put(BASEURL+'api/Questions', data, {
                    headers: headers
                  })
                  .then((response) => {
                    if(response.data!==null){
                        Toast.fire({
                            icon: 'success',
                            title: 'Soru güncellendi!'
                        });
                        this.getQuestions();
                    }
                    else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                    }
                  })
                  .catch((error) => {
                      if(error.response!=undefined){
                            if(error.response.data.errors[0]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[0]
                                });
                            }
                            else if(error.response.data.errors[1]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[1]
                                });
                            }
                            else if(error.response.data.errors[2]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[2]
                                });
                            }
                            else if(error.response.data.errors[3]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[3]
                                });
                            }
                            else if(error.response.data.errors[4]!==null){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[4]
                                });
                            }
                            else{
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors[5]
                                });
                            }
                      }
                      else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                      }
                  })
            },
            isActive(index){
                this.question = this.questions[index];
                axios.put(BASEURL+'api/Questions/IsActive',this.question, {
                    headers: headers
                })
                .then(response => {
                    if(response.data !== null){
                        if(response.data.isActive){
                            Toast.fire({
                                icon: 'success',
                                title: 'Soru aktif oldu!'
                            });
                        }
                        else{
                            Toast.fire({
                                icon: 'success',
                                title: 'Soru pasif oldu!'
                            });
                        }
                        this.getQuestions();
                    }
                    else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                    }
                    this.getQuestions();
                })
                .catch(error => {
                    if(error.response !== undefined){
                        Toast.fire({
                            icon: 'error',
                            title: error.response.data.errors
                        });
                    }
                    else{
                        Toast.fire({
                            icon: 'error',
                            title: 'Bir hata oluştu!'
                        });
                    }
                })
            },
            remove(question, id){
                Swal.fire({
                    title: "Silmek istiyor musun?",
                    text: "Soruyu silmek istediğinize emin misiniz?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: "Evet, sil!",
                    cancelButtonText: "İptal!",
                    closeOnConfirm: true
                }).then(result => {
                    if(result.value){
                        this.questions.splice(this.questions.indexOf(question), 1);
                        axios.delete(BASEURL+'api/Questions/'+ id, {
                            headers: headers
                        })
                        .then(response => {
                            if(response.status === 204){
                                Toast.fire({
                                    icon: 'success',
                                    title: 'Soru silindi!'
                                })
                            }
                            else{
                                Toast.fire({
                                    icon: 'error',
                                    title: 'Soru silinemedi!'
                                })
                            }
                        })
                        .catch(error => {
                            if(error.response !== undefined){
                                Toast.fire({
                                    icon: 'error',
                                    title: error.response.data.errors
                                });
                            }
                            else{
                                Toast.fire({
                                    icon: 'error',
                                    title: 'Bir hata oluştu!'
                                });
                            }
                        })
                    }
                })
            }
        },
        mounted() {
            this.getQuestions();
            this.getCategories();
        }
    });

    //#endregion 

}

//#endregion

//#region Swal Toast
// SwalAlert kütüphanesini toast modda kullanma
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    onOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

//#endregion