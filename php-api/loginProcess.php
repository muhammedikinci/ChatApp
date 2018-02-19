<?php 

class Login{
	
	private $Database;
	private $UserName;
	private $Password;	

	private $ErrorMessage;
	private $LoginPermission = false;

	function __construct(){
        $this->PrintHeader();
		//Veritabanını dene
		if($this->TryConnectToDB()){
			//Verileri Kontrol Et
			if($this->isSetLoginData()){
				//Sorun yoksa login olabilir
				$this->LoginPermission = true;
			}
			else{
				$this->LoginPermission = false;
				echo '{"status":"login_fail","error":"'.$this->ErrorMessage.'"}';
			}
		}
		else{
			echo '{"status":"db_fail","error":"'.$this->ErrorMessage.'"}';
		}
	}

	function Login(){
		//Diğer koşullar sağlandımı diye kontrol et
		if($this->LoginPermission){
			$QueryString = "Select * from users where `Usr_Name`='".$this->UserName."' and `Usr_Pass`='".$this->Password."'";
			$queryResult = $this->Database->query($QueryString)->fetch(PDO::FETCH_ASSOC);
			if ($queryResult) {
				echo '{"status":"ok"}';
			}
			else{
				echo '{"status":"failed","error":"Kullanıcı Adı veya Şifre yanlış!"}';
			}
		}
	}

	function isSetLoginData(){
		//Verileri kontrol et
		if(isset($_POST['username']) && 
		   isset($_POST['password']) && 
		   !empty($_POST['username']) &&
		   !empty($_POST['password']) &&
		   strlen($_POST['username']) > 3 &&
		   strlen($_POST['password']) > 3){
			$this->UserName = htmlspecialchars($_POST['username']);
			$this->Password = md5(htmlspecialchars($_POST['password']));
			return true;
		}
		else{
			$this->ErrorMessage = "Alanları boş bırakamazsın!";
			return false;
		}
	}

	function PrintHeader(){
		//Hataları gösterme
		error_reporting(0);
		//Cevapları text halinde almak için headerları ayarla
		header('Content-Type: text/plain');
		header("Access-Control-Allow-Origin: *");
		header("Access-Control-Allow-Headers: Content-type");
	}

	//Database bağlantı testi
	function TryConnectToDB(){
		try
		{
			$this->Database = new PDO("mysql:host=localhost;dbname=soneqeqy_c2c;charset=utf8",'soneqeqy_c2c','c2c321');
		}
		catch(PDOException $e)
		{
			//Hata çıkarsa değişkene at ve false döndür
			$ErrorMessage = $e->getMessage();
			return false;
		}
		//Sıkıntı çıkmazsa true döndür
		return true;
	}
}

$LoginClass = new Login();
$LoginClass->Login();
 ?>