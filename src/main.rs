
                    fn main() {
                        let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
                    
                        for stream in listener.incoming() {
                            let stream = stream.unwrap();
                    
                            handle_connection(stream);
                        }
                    }
                    fn handle_connection(mut stream: TcpStream) {
                        let buf_reader = BufReader::new(&mut stream);
                        let http_request: Vec<_> = buf_reader
                            .lines()
                            .map(|result| result.unwrap())
                            .take_while(|line| !line.is_empty())
                            .collect();
                    
                        let status_line = "HTTP/1.1 200 OK";
                        let contents = "<html><header></header><body>Hello Chris</body></html>";
                        let length = contents.len();
                    
                        let response =
                            format!("{status_line}
Content-Length: {length}

{contents}");
                    
                        stream.write_all(response.as_bytes()).unwrap();
                    }
                    